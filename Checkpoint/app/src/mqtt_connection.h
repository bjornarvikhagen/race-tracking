#ifndef _MQTTCONNECTION_H_
#define _MQTTCONNECTION_H_
#include <zephyr/net/mqtt.h>
#include <zephyr/net/socket.h>

#define IMEI_LEN 15
#define CGSN_RESPONSE_LENGTH (IMEI_LEN + 6 + 1) /* Add 6 for \r\nOK\r\n and 1 for \0 */
#define CLIENT_ID_LEN sizeof("nrf-") + IMEI_LEN

int client_init(struct mqtt_client *client);
void fds_init(struct mqtt_client *c, struct pollfd *fds);
int data_publish(struct mqtt_client *c, enum mqtt_qos qos, uint8_t *data, size_t len);
int certificate_provision(void);
int imei_init(void);

extern char imei_str[IMEI_LEN + 1];

#endif /* _MQTTCONNECTION_H_ */