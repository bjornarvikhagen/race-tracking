#ifndef _NETWORK_H_
#define _NETWORK_H_
#include <zephyr/drivers/gpio.h>
#include "passing_buffer.h"

static const struct gpio_dt_spec led;

int mqtt_keepalive_thread(void);
int publish_thread(struct passing_buffer *buffer);
int network_init(void);

extern struct k_sem publish_semaphore;
extern struct k_sem keepalive_semaphore;
extern struct k_sem buffer_semaphore;
extern struct passing_buffer passing_buffer;

extern int is_mqtt_connected;

#endif /* _NETWORK_H_ */