#ifndef _NETWORK_H_
#define _NETWORK_H_
#include <zephyr/drivers/gpio.h>
#include "passing_buffer.h"

static const struct gpio_dt_spec led;

int mqtt_keepalive_thread(struct passing_buffer *buffer, uint32_t *rfid_tag);
int publish_thread(struct passing_buffer *buffer, uint32_t *rfid_tag);
int network_init(void);

extern struct k_sem publish_semaphore;
extern struct k_sem keepalive_semaphore;
extern struct k_sem buffer_semaphore;
extern struct k_sem tag_reader_semaphore;
extern struct passing_buffer passing_buffer;

#endif /* _NETWORK_H_ */