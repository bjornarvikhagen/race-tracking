#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <ncs_version.h>

#include <zephyr/logging/log.h>
#include <zephyr/kernel.h>
#include <zephyr/net/socket.h>
#include <zephyr/net/mqtt.h>
#include <nrf_modem_at.h>
#include <modem/modem_key_mgmt.h>

#include "mqtt_connection.h"
#include "network.h"
#include "certificate.h"

#if NCS_VERSION_NUMBER < 0x20600
#include <zephyr/random/rand32.h>
#else
#include <zephyr/random/random.h>
#endif

// Enable logging for this file
LOG_MODULE_DECLARE(PathPatrol);

// MQTT client buffers
static uint8_t rx_buffer[CONFIG_MQTT_MESSAGE_BUFFER_SIZE];
static uint8_t tx_buffer[CONFIG_MQTT_MESSAGE_BUFFER_SIZE];
static uint8_t payload_buf[CONFIG_MQTT_PAYLOAD_BUFFER_SIZE];

// MQTT Client username and password initialization
static struct mqtt_utf8 username = {
    .utf8 = "NULL",
    .size = 0
};
static struct mqtt_utf8 password = {
    .utf8 = "NULL",
    .size = 0
};

// String format IMEI number. Used as checkpoint ID.
char imei_str[IMEI_LEN + 1] = {0};

// MQTT broker details
static struct sockaddr_storage broker;

/** @brief Stores the certificate for the server on the modem.
 *  @returns Non-zero value on error, 0 if success.
*/
int certificate_provision(void) {
    int err = 0;
    bool exists;

    LOG_INF("Checking for certificates.");
    err = modem_key_mgmt_exists(CONFIG_MQTT_TLS_SEC_TAG, MODEM_KEY_MGMT_CRED_TYPE_CA_CHAIN, &exists);
    if (err) {
        LOG_ERR("Failed to check for certificates, err: %d", err);
        return err;
    }

    LOG_INF("%s", exists ? "Exists" : "Doesn't exist");
    if (exists) {
        err = modem_key_mgmt_cmp(CONFIG_MQTT_TLS_SEC_TAG, MODEM_KEY_MGMT_CRED_TYPE_CA_CHAIN, CA_CERTIFICATE, strlen(CA_CERTIFICATE));
        LOG_INF("Certificate %s", err ? "mismatch" : "match");
        if (!err) {
            return err;
        }
    }
    LOG_INF("Provisioning certificates");
    err = modem_key_mgmt_write(CONFIG_MQTT_TLS_SEC_TAG, MODEM_KEY_MGMT_CRED_TYPE_CA_CHAIN, CA_CERTIFICATE, strlen(CA_CERTIFICATE));
    if (err) {
        LOG_ERR("Failed to provision CA certificate: %d", err);
        return err;
    }
    return err;
}

/** @brief Function to subscribe to the configured topic.
 *  See CONFIG_MQTT_SUB_TOPIC for configured subscription topic.
 */
static int subscribe(struct mqtt_client *const c)
{
	struct mqtt_topic subscribe_topic = {
		.topic = {
			.utf8 = CONFIG_MQTT_SUB_TOPIC,
			.size = strlen(CONFIG_MQTT_SUB_TOPIC)
		},
		.qos = MQTT_QOS_1_AT_LEAST_ONCE
	};

	const struct mqtt_subscription_list subscription_list = {
		.list = &subscribe_topic,
		.list_count = 1,
		.message_id = 1234
	};

	LOG_INF("Subscribing to: %s len %u", CONFIG_MQTT_SUB_TOPIC,
		(unsigned int)strlen(CONFIG_MQTT_SUB_TOPIC));

	return mqtt_subscribe(c, &subscription_list);
}

/** @brief Function to get the payload of received data.
 *  @returns Non-zero value on error, 0 if success.
*/
static int get_received_payload(struct mqtt_client *c, size_t length) {
    int ret;
    int err = 0;
    /* Return an error if the payload is larger than the payload buffer.
	 * Note: To allow new messages, we have to read the payload before returning.
	 */
    if (length > sizeof(payload_buf)) {
        err = -EMSGSIZE;
    }

    /* Truncate payload until it fits in the payload buffer. */
    while (length > sizeof(payload_buf)) {
        ret = mqtt_read_publish_payload_blocking(
            c, payload_buf, (length - sizeof(payload_buf)));
        if (ret == 0) {
            return -EIO;
        } else if (ret < 0) {
            return ret;
        }
        length -= ret;
    }

    ret = mqtt_readall_publish_payload(c, payload_buf, length);
    if (ret) {
        return ret;
    }

    return err;
}

/** @brief Function to print strings without null-termination
*/
static void data_print(uint8_t *prefix, uint8_t *data, size_t len) {
    char buf[len + 1];

    memcpy(buf, data, len);
    buf[len] = 0;
    LOG_INF("%s%s", (char *)prefix, (char *)buf);
}

/** @brief Function to publish data on the configured topic.
 *  See CONFIG_MQTT_PUB_TOPIC for configured publishing topic.
 *  @param c Pointer to client who is to publish the data.
 *  @param qos Quality of service for the published message.
 *  @param data Pointer to bytestream of data to publish.
 *  @param len Length of data.
 *  @returns 0 on success, negative error code on error.
*/
int data_publish(struct mqtt_client *c, enum mqtt_qos qos, uint8_t *data, size_t len) {
    struct mqtt_publish_param param;

    param.message.topic.qos = qos;
    param.message.topic.topic.utf8 = CONFIG_MQTT_PUB_TOPIC;
    param.message.topic.topic.size = strlen(CONFIG_MQTT_PUB_TOPIC);
    param.message.payload.data = data;
    param.message.payload.len = len;
    param.message_id = sys_rand32_get();
    param.dup_flag = 0;
    param.retain_flag = 0;

    data_print("Publishing: ", data, len);
    LOG_INF("to topic: %s len: %u", CONFIG_MQTT_PUB_TOPIC, (unsigned int)strlen(CONFIG_MQTT_PUB_TOPIC));

    return mqtt_publish(c, &param);
}

/** @brief MQTT client event handler.
 *  @param c Pointer to constant client whose events are to be handled by this event handler.
*/
void mqtt_evt_handler(struct mqtt_client *const c, const struct mqtt_evt *evt) {
    int err;

    switch (evt->type) {
        /* MQTT_EVT_CONNACK: Connection to broker established and acknowledged. */
        case MQTT_EVT_CONNACK:
            if (evt->result != 0) {
                LOG_ERR("MQTT connect failed: %d", evt->result);
                break;
            }
            #if CONFIG_MQTT_SUBSCRIBE == 1
            subscribe(&c);
            #endif
            break;
        
        /* MQTT_ECT_DISCONNECT: Broker disconnected client, typically due to not running mqtt_live() on time. */
        case MQTT_EVT_DISCONNECT:
            LOG_INF("MQTT client disconnected: %d", evt->result);
            /* Set to 0 such that publish thread doesn't attempt to publish
               data while the MQTT client is disconnected from the broker. */
		    is_mqtt_connected = 0;
            break;
        
        /* MQTT_EVT_PUBLISH: Receive data that has been published on a topic the client has subscribed to. */
        case MQTT_EVT_PUBLISH:
            const struct mqtt_publish_param *p = &evt->param.publish;
            /* Print length of received message */
            LOG_INF("MQTT PUBLISH result=%d len=%d", evt->result, p->message.payload.len);
            
            /* Extract data of received message */
            err = get_received_payload(c, p->message.payload.len);

            /* Send ack to broker on receiving QoS1 publish message */
            if (p->message.topic.qos == MQTT_QOS_1_AT_LEAST_ONCE) {
                const struct mqtt_puback_param ack = {
                    .message_id = p->message_id
                };
                mqtt_publish_qos1_ack(c, &ack);
            }

            /* On successful extraction of data */
            if (err >= 0) {
                data_print("Received: ", payload_buf, p->message.payload.len);
            } /* On failed extraction of data */
            else if (err == -EMSGSIZE) {
                LOG_ERR("Received payload (%d bytes) is larger than the payload buffer size (%d bytes).", 
                    p->message.payload.len, sizeof(payload_buf));
            } else {
                LOG_ERR("get_received_payload failed: %d", err);
                LOG_INF("Disconnecting MQTT client...");

                err = mqtt_disconnect(c);
                if (err) {
                    LOG_ERR("Could not disconnect: %d", err);
                }
            }

            break;

        /* MQTT_EVT_PUBACK: Broker ack-ed data that the client published. */
        case MQTT_EVT_PUBACK:
            if (evt->result != 0) {
                LOG_ERR("MQTT PUBACK error: %d", evt->result);
                break;
            }
            LOG_INF("PUBACK packet id: %u", evt->param.puback.message_id);
            break;

        /* MQTT_EVT_SUBACK: Subscription acknowledgement. */
        case MQTT_EVT_SUBACK:
            if (evt->result != 0) {
                LOG_ERR("MQTT SUBACK error: %d", evt->result);
                break;
            }
            LOG_INF("SUBACK packet id: %u", evt->param.suback.message_id);
            break;
        
        /* MQTT_EVT_PRINGRESP: Ping response from server. */
        case MQTT_EVT_PINGRESP:
            if (evt->result != 0) {
                LOG_ERR("MQTT PINGRESP error: %d", evt->result);
            }
            break;
        
        default:
            LOG_INF("Unhandled MQTT event type: %d", evt->type);
            break;
    }
}

/** @brief Resolves the configured hostname and initializes the MQTT broker structure.
 *  @returns Non-zero value on error, 0 if success.
*/
static int broker_init(void) {
    int err;
    struct addrinfo *result;
    struct addrinfo *addr;
    struct addrinfo hints = {
        .ai_family = AF_INET,
        .ai_socktype = SOCK_STREAM
    };

    err = getaddrinfo(CONFIG_MQTT_BROKER_HOSTNAME, NULL, &hints, &result);
    if (err) {
        LOG_ERR("getaddrinfo failed: %d", err);
        return -ECHILD;
    }

    addr = result;

    /* Look for address of the broker */
    while (addr != NULL) {
        /* IPv4 address */
        if (addr->ai_addrlen == sizeof(struct sockaddr_in)) {
            struct sockaddr_in *broker4 = ((struct sockaddr_in *)&broker);
            char ipv4_addr[NET_IPV4_ADDR_LEN];

            broker4->sin_addr.s_addr = ((struct sockaddr_in*)addr->ai_addr)->sin_addr.s_addr;
            broker4->sin_family = AF_INET;
            broker4->sin_port = htons(CONFIG_MQTT_BROKER_PORT);

            inet_ntop(AF_INET, &broker4->sin_addr.s_addr, ipv4_addr, sizeof(ipv4_addr));
            LOG_INF("IPv4 Address found %s", (char *)(ipv4_addr));

            break;
        } else {
            LOG_ERR("ai_addrlen = %u should be %u or %u",
                (unsigned int)addr->ai_addrlen,
                (unsigned int)sizeof(struct sockaddr_in),
                (unsigned int)sizeof(struct sockaddr_in6));
        }

        addr = addr->ai_next;
    }

    freeaddrinfo(result);

    return err;
}

/** @brief Function to get client id.
 *  If client_id has been defined in prj.conf, it picks that to use.
 *  If a custom client ID hasn't been defined, it picks the IMEI number of the device instead.
 *  To avoid issues with imei_init() not having been called before client_id_get(), this obtains
 *  the IMEI number from the modem without using the imei_str reference.
 *  @returns uint8_t* of client_id.
*/
static const uint8_t* client_id_get(void) {
    static uint8_t client_id[MAX(sizeof(CONFIG_MQTT_CLIENT_ID), CLIENT_ID_LEN)];

    if (strlen(CONFIG_MQTT_CLIENT_ID) > 0) {
        snprintf(client_id, sizeof(client_id), "%s", CONFIG_MQTT_CLIENT_ID);
        goto exit;
    }

    char imei_buf[CGSN_RESPONSE_LENGTH + 1];
    int err;

    err = nrf_modem_at_cmd(imei_buf, sizeof(imei_buf), "AT+CGSN");
    if (err) {
        LOG_ERR("Failed to obtain IMEI, error: %d", err);
        goto exit;
    }

    imei_buf[IMEI_LEN] = '\0';

    snprintf(client_id, sizeof(client_id), "nrf-%.*s", IMEI_LEN, imei_buf);

exit:
    LOG_DBG("client_id = %s", (char *)(client_id));
    return client_id;
}

/** @brief Initializes the global imei_str variable to be equal to the IMEI number of the device.
 *  @returns Non-zero value on error, 0 if success.
*/
int imei_init(void) {
    char imei_buf[CGSN_RESPONSE_LENGTH + 1];
    int err;

    err = nrf_modem_at_cmd(imei_buf, sizeof(imei_buf), "AT+CGSN");
    if (err) {
        LOG_ERR("Failed to obtain IMEI, error: %d", err);
        return -1;
    }

    imei_buf[IMEI_LEN] = '\0';

    snprintf(imei_str, IMEI_LEN + 1, "%s", imei_buf);

    imei_buf[IMEI_LEN + 1] = '\0';

    LOG_INF("IMEI: %s", imei_str);
    return 0;
}

/** @brief Initialize MQTT client structure.
 *  @param client Pointer to client object to initialize.
 *  @returns Non-zero value on error, 0 if success.
*/
int client_init(struct mqtt_client *client) {
    int err;
    /* Initializes the client instance. */
    mqtt_client_init(client);

    /* Rsolved hostname and initializes MQTT broker structure */
    err = broker_init();
    if (err) {
        LOG_ERR("Failed to initialize broker connection.");
        return err;
    }

    /* MQTT client configuration */
    client->broker = &broker;
    client->evt_cb = mqtt_evt_handler;
    client->client_id.utf8 = client_id_get();
    client->client_id.size = strlen(client->client_id.utf8);
    client->protocol_version = MQTT_VERSION_3_1_1;

    if (strcmp(CONFIG_MQTT_USERNAME, "NULL") != 0) {
        username.utf8 = CONFIG_MQTT_USERNAME;
        username.size = strlen(CONFIG_MQTT_USERNAME);
        client->user_name = &username;
    } else {
        client->user_name = NULL;
    }

    if (strcmp(CONFIG_MQTT_PASSWORD, "NULL") != 0) {
        password.utf8 = CONFIG_MQTT_PASSWORD;
        password.size = strlen(CONFIG_MQTT_PASSWORD);
        client->password = &password;
    } else{
        client->password = NULL;
    }
    
    LOG_INF("MQTT Client Username: %s", CONFIG_MQTT_USERNAME);
    LOG_INF("MQTT Client Password: %s", CONFIG_MQTT_PASSWORD);
    LOG_INF("MQTT Client ID: %s", client_id_get());

    /* MQTT buffers configuration */
    client->rx_buf = rx_buffer;
    client->rx_buf_size = sizeof(rx_buffer);
    client->tx_buf = tx_buffer;
    client->tx_buf_size = sizeof(tx_buffer);

    /* Using TLS */
    struct mqtt_sec_config *tls_cfg = &(client->transport).tls.config;
    static sec_tag_t sec_tag_list[] = { CONFIG_MQTT_TLS_SEC_TAG };

    LOG_INF("TLS enabled");
    client->transport.type = MQTT_TRANSPORT_SECURE;

    tls_cfg->peer_verify = CONFIG_MQTT_TLS_PEER_VERIFY;
    tls_cfg->cipher_list = NULL;
    tls_cfg->cipher_count = 0;
    tls_cfg->sec_tag_count = ARRAY_SIZE(sec_tag_list);
    tls_cfg->sec_tag_list = sec_tag_list;
    tls_cfg->hostname = CONFIG_MQTT_BROKER_HOSTNAME;
    
    tls_cfg->session_cache = IS_ENABLED(CONFIG_MQTT_TLS_SESSION_CACHING) ? TLS_SESSION_CACHE_ENABLED : TLS_SESSION_CACHE_DISABLED;

    return err;
}

/** @brief Initialize the file descriptor structure used by poll.
 *  @param c Pointer to client whose MQTT file descriptor is to be initialized.
 *  @param fds Pointer to client's pollfd.
*/
void fds_init(struct mqtt_client *c, struct pollfd *fds) {
    if (c->transport.type == MQTT_TRANSPORT_NON_SECURE) {
        fds->fd = c->transport.tcp.sock;
    } else {
        fds->fd = c->transport.tls.sock;
    }
    fds->events = POLLIN;
}