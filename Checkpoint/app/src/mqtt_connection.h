#ifndef _MQTTCONNECTION_H_
#define _MQTTCONNECTION_H_

#define IMEI_LEN 15
#define CGSN_RESPONSE_LENGTH (IMEI_LEN + 6 + 1) /* Add 6 for \r\nOK\r\n and 1 for \0 */
#define CLIENT_ID_LEN sizeof("nrf-") + IMEI_LEN

/**@brief Initialize the MQTT client structure 
*/
int client_init(struct mqtt_client *client);

/**@brief Initialize the file descriptor structure used by poll 
*/
int fds_init(struct mqtt_client *c, struct pollfd *fds);

/**@brief Function to publish data on configured topic 
*/
int data_publish(struct mqtt_client *c, enum mqtt_qos qos, uint8_t *data, size_t len);

int certificate_provision(void);

int imei_init(void);
int imei_str_init(void);
extern char imei_str[IMEI_LEN + 1];
uint64_t* get_imei(void);

//static uint8_t imei_str[IMEI_LEN];

extern struct k_sem cert_provisioning;

#endif /* _MQTTCONNECTION_H_ */