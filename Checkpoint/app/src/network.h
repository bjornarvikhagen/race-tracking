#ifndef _NETWORK_H_
#define _NETWORK_H_
#include <zephyr/drivers/gpio.h>
#include "passing_buffer.h"

static const struct gpio_dt_spec led;

int network_thread(struct passing_buffer *buffer, uint32_t *rfid_tag);
int network_init(void);

extern struct k_sem network_semaphore;
extern struct k_sem buffer_semaphore;
extern struct passing_buffer passing_buffer;

#endif /* _NETWORK_H_ */