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

// mqtt client struct
static struct mqtt_client client;
// file descriptor
static struct pollfd fds;

static uint8_t data_to_publish[20] = {0};

#define LED0_NODE DT_ALIAS(led0)
static const struct gpio_dt_spec led = GPIO_DT_SPEC_GET(LED0_NODE, gpios);

static K_SEM_DEFINE(lte_connected, 0, 1);
static K_SEM_DEFINE(publishing_rfid, 1, 1);
K_SEM_DEFINE(cert_provisioning, 0, 1);

/* Define the event handler for LTE link control. */
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
 * First configures LED0, then initializes the modem library, then
 * provisions the certificate, and then finally connects to cellular LTE-M.
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
	
	k_sem_take(&cert_provisioning, K_FOREVER);

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
 * runs a keepalive loop in main to keep the MQTT connection alive.
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
		LOG_ERR("Failed to initialize IMEI of the device: %d", err);
		return err;
	}
	LOG_INF("Client initialized.");
	return 0;
}

int mqtt_keepalive_thread(struct passing_buffer *buffer, uint32_t *rfid_tag) {
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
		goto do_connect;
	}

	err = fds_init(&client, &fds);
	if (err) {
		LOG_ERR("Error in fds_init: %d", err);
		return 0;
	}

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
		
		if ((fds.revents & POLLIN) == POLLIN) {
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

int publish_thread(struct passing_buffer *buffer, uint32_t *rfid_tag) {
    k_sem_take(&publish_semaphore, K_FOREVER); // wait for main
	int fail_count = 0;
	int err = 0;
	while (1) {
		if (buffer->size > 0) {
			k_sem_take(&publishing_rfid, K_FOREVER);
			k_sem_take(&buffer_semaphore, K_FOREVER);
			dequeue(buffer, rfid_tag);
			k_sem_give(&buffer_semaphore);
			fail_count = 0;
			while (fail_count >= 0) {
				LOG_INF("RFID tag: %X", *rfid_tag);
				uint8_t rfid_tag_str[RFID_STR_LEN + 1] = {0};
				sprintf(rfid_tag_str, "%X", *rfid_tag);
				err = data_publish(&client, MQTT_QOS_1_AT_LEAST_ONCE, rfid_tag_str, RFID_STR_LEN/* sizeof(rfid_tag_str)-1 */);
				if (err) {
					fail_count++;
					LOG_ERR("Failed to send message, %d", err);
					LOG_ERR("fail_count: %d", fail_count);
				} 
				else if (err == 0) {
					fail_count = -1;
					LOG_INF("Tag sent to broker.");
					k_sem_give(&publishing_rfid);
				}
			}
		} else {
			k_msleep(10000);
		}
	}
}