#include <stdio.h>
#include <ncs_version.h>
#include <zephyr/kernel.h>
#include <zephyr/net/socket.h>
#include <zephyr/drivers/gpio.h>
#include <zephyr/logging/log.h>
#include <modem/nrf_modem_lib.h>
#include <modem/lte_lc.h>
#include <zephyr/net/mqtt.h>

#include "network.h"
#include "mqtt_connection.h"
#include "passing_buffer.h"

LOG_MODULE_DECLARE(PathPatrol);

/* MQTT client struct. */
static struct mqtt_client client;
/* File descriptor for MQTT connection. (Similar to fds for sockets.) */
static struct pollfd fds;

/* Global int to check if the client is still connected to the broker.
   Set to 1 if it's connected. */
int is_mqtt_connected = 0;

/* Get GPIO data for LED control. */
#define LED0_NODE DT_ALIAS(led0)
static const struct gpio_dt_spec led = GPIO_DT_SPEC_GET(LED0_NODE, gpios);

/* Semaphore to run lte_lc_connect_async() blocking in the main thread. */
static K_SEM_DEFINE(lte_connected, 0, 1);

/** @brief Event handler for LTE link control.
*/
static void lte_handler(const struct lte_lc_evt *const evt)
{
	switch (evt->type) {
	/* On changed registration status, print status. */
	case LTE_LC_EVT_NW_REG_STATUS:
		if ((evt->nw_reg_status != LTE_LC_NW_REG_REGISTERED_HOME) &&
			(evt->nw_reg_status != LTE_LC_NW_REG_REGISTERED_ROAMING)) {
			break;
		}
		LOG_INF("Network registration status: %s\n",
				evt->nw_reg_status == LTE_LC_NW_REG_REGISTERED_HOME ?
				"Connected - home network" : "Connected - roaming");
		k_sem_give(&lte_connected);
		break;

	/* On event RRC update, print RRC mode. */
	case LTE_LC_EVT_RRC_UPDATE:
		LOG_INF("RRC mode: %s\n", evt->rrc_mode == LTE_LC_RRC_MODE_CONNECTED ?
				"Connected" : "Idle");
		break;

	default:
		break;
	}
}

/** @brief Configures the modem and connects to LTE.
 *  First configures LED0, then initializes the modem library, then
 *  provisions the certificate, and then finally connects to cellular LTE-M.
 *  @returns Non-zero value on error, 0 if success.
*/
static int modem_configure(void)
{
	int err;

	if (!gpio_is_ready_dt(&led)) {
		LOG_ERR("LED not ready.");
		return -1317;
	}
	err = gpio_pin_configure_dt(&led, GPIO_OUTPUT_ACTIVE);
	if (err) {
		LOG_ERR("Failed to configure LED, error: %d", err);
		return err;
	}
	LOG_INF("LED is ready and configured.");

	LOG_INF("Initializing modem library\n");
	err = nrf_modem_lib_init(NORMAL_MODE);
	if (err) {
		LOG_ERR("Failed to initialize the modem library, error: %d", err);
		return err;
	}

	/* CircuitDojo nRF9160 Feather likes to conect to LTE before running main,
	   LTE connection must be offline to provision certificate. */
	LOG_INF("Disconnecting from open LTE connection.");
	err = lte_lc_offline();
	if (err) {
		LOG_ERR("Failed to disconnect from LTE connection, error: %d", err);
		err = 0;
	}

	/* Store certificate in the modem while the modem is in offline mode. */
	err = certificate_provision();
	if (err != 0) {
		LOG_ERR("Failed to provision certificates");
		return err;
	}

	/* lte_lc_init deprecated in >= v2.6.0 */
	#if NCS_VERSION_NUMBER < 0x20600
	err = lte_lc_init();
	if (err) {
		LOG_ERR("Failed to initialize LTE link control library, error: %d", err);
		return err;
	}
	#endif
	
	LOG_INF("Connecting to LTE network\n");
	err = lte_lc_connect_async(lte_handler);
	if (err) {
		LOG_ERR("Error in lte_lc_connect_async, error: %d", err);
		return err;
	}

	/* Wait for connect to finish. Semaphore given in lte_handler on event LTE_LC_EVT_NW_REG_STATUS. */
	k_sem_take(&lte_connected, K_FOREVER);
	LOG_INF("Connected to LTE network\n");

	err = gpio_pin_toggle_dt(&led);
	if (err) {
		LOG_ERR("Failed to toggle LED pin, error: %d", err);
	}
	LOG_INF("Led toggled.");

	return 0;
}

/** @brief Runs all init functions to set up a client-broker MQTT connection, then
 *  runs a keepalive loop in main to keep the MQTT connection alive.
 *  @returns Non-zero value on error, 0 if success.
*/
int network_init(void)
{
	int err = 0;

	err = modem_configure();
	if (err) {
		LOG_ERR("Failed to configure the modem, error: %d", err);
		return err;
	}

	err = client_init(&client);
	if (err) {
		LOG_ERR("Failed to initialize MQTT client: %d", err);
		return err;
	}

	err = imei_init();
	if (err) {
		LOG_ERR("Failed to initialize IMEI string of the device: %d", err);
		return err;
	}
	LOG_INF("Client initialized.");
	return 0;
}

/** @brief Entrypoint function for the MQTT connection keepalive thread. This 
 *  function is intended to run in it's own thread to run mqtt_live and maintain
 * 	a connection. It also handles return events from the MQTT connection file descriptors.
 *  @returns This function never returns.
*/
int mqtt_keepalive_thread(void) {
    k_sem_take(&keepalive_semaphore, K_FOREVER); // wait for main
	uint32_t connect_attempt = 0;
do_connect:
	int err = 0;
	if (connect_attempt++ > 0) {
		LOG_INF("Reconnecting in %d seconds...", CONFIG_MQTT_RECONNECT_DELAY_S);
		k_sleep(K_SECONDS(CONFIG_MQTT_RECONNECT_DELAY_S));
	}
	err = mqtt_connect(&client);
	if(err) {
		LOG_ERR("Error in mqtt_connect: %d", err);
		is_mqtt_connected = 0;
		goto do_connect;
	}
	is_mqtt_connected = 1;

	fds_init(&client, &fds);

	while (1) {
		int keepalive_time = mqtt_keepalive_time_left(&client);
		LOG_INF("Keepalive timer: %d", keepalive_time);
		err = poll(&fds, 1, mqtt_keepalive_time_left(&client));
		if (err < 0) {
			LOG_ERR("Error in poll for mqtt_keepalive_time_left: %d", errno);
			break;
		}

		err = mqtt_live(&client);
		if ((err != 0) && (err != -EAGAIN)) {
			LOG_ERR("Error in mqtt_live: %d", err);
			break;
		}
		
		if ((fds.revents & POLLIN) == POLLIN && is_mqtt_connected == 1) {
			err = mqtt_input(&client);
			if (err != 0) {
				LOG_ERR("Error in mqtt_input: %d", err);
				break;
			}
		}

		if ((fds.revents & POLLERR) == POLLERR) {
			LOG_ERR("POLLERR");
			break;
		}

		if((fds.revents & POLLNVAL) == POLLNVAL) {
			LOG_ERR("POLLNVAL");
			break;
		}
	}
	LOG_INF("Disconnecting MQTT client");
	err = mqtt_disconnect(&client);
	if (err) {
		LOG_ERR("Could not disconnect MQTT client: %d", err);
	}
	goto do_connect;

	/* never reached */
	return 0;
}

/** @brief Entrypoint function for the publish thread. This function runs a loop as 
 * 	often as defined by CONFIG_MQTT_PUBLISH_TIMER_MS. It dequeues a passing from the 
 *  passing buffer and attempts to publish it to the configured publishing topic.
 *  @returns This function never returns.
*/
int publish_thread(struct passing_buffer *buffer) {
    k_sem_take(&publish_semaphore, K_FOREVER); // wait for main
	int fail_count = 0;
	int err = 0;
	while (1) {
		if (is_mqtt_connected == 1 && buffer->size > 0) {
			uint32_t rfid_tag = 0;
			uint64_t time = 0;

			k_sem_take(&buffer_semaphore, K_FOREVER);
			dequeue(buffer, &rfid_tag, &time);
			k_sem_give(&buffer_semaphore);

			fail_count = 0;
			while (fail_count >= 0) {
				uint64_t current_time = (k_cycle_get_32()*1000)/sys_clock_hw_cycles_per_sec();
				uint64_t time_since_passing = current_time - time;
				uint8_t time_since_pass_buf[12] = {0};
				sprintf(time_since_pass_buf, "%d", time_since_passing);
				LOG_INF("time since passing: %s", time_since_pass_buf);

				LOG_INF("RFID tag: %X", rfid_tag);
				char rfid_tag_str[RFID_STR_LEN + 1] = {0};
				sprintf(rfid_tag_str, "%X", rfid_tag);

				char payload[80] = {0};
				strcpy(payload, imei_str);
				strcat(payload, ":");
				strcat(payload, rfid_tag_str);
				strcat(payload, ":");
				strcat(payload, time_since_pass_buf);

				err = data_publish(&client, MQTT_QOS_1_AT_LEAST_ONCE, payload, strlen(payload));
				if (err) {
					fail_count++;
					LOG_ERR("Failed to send message, %d", err);
					LOG_ERR("fail_count: %d", fail_count);
				} 
				else if (err == 0) {
					fail_count = -1;
					LOG_INF("Tag sent to broker.");
				}
			}
		} else {
			k_msleep(CONFIG_MQTT_PUBLISH_TIMER_MS);
		}
	}
}