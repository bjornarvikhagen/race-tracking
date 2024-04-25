#include <zephyr/kernel.h>
#include <zephyr/device.h>
#include <zephyr/devicetree.h>
#include <zephyr/drivers/i2c.h>
#include <zephyr/drivers/gpio.h>
#include <zephyr/sys/util.h>
#include <zephyr/logging/log.h>

#include "network.h"
#include "nfc.h"
#include "passing_buffer.h"
#include "mqtt_connection.h"

LOG_MODULE_REGISTER(PathPatrol, LOG_LEVEL_INF);

struct passing_buffer passing_buffer;

//Semaphore for ensuring no problems with the shared memory
K_SEM_DEFINE(buffer_semaphore, 1, 1);

K_SEM_DEFINE(publish_semaphore, 0, 1);
K_SEM_DEFINE(keepalive_semaphore, 0, 1);
K_SEM_DEFINE(tag_reader_semaphore, 0, 1);

uint32_t rfid_tag1;
uint32_t rfid_tag2;
uint64_t passing_time1;
uint64_t passing_time2;

void tag_reader_thread(struct passing_buffer *buffer, uint32_t *rfid_tag, uint64_t *time) {
    k_sem_take(&tag_reader_semaphore, K_FOREVER); // wait for main

    while(1) {
        int ret = pn532_get_tag(rfid_tag);

        k_sem_take(&buffer_semaphore, K_FOREVER);
        if (ret == 0) {
            *time = (k_cycle_get_32()*1000)/sys_clock_hw_cycles_per_sec();
            enqueue(buffer, rfid_tag, time);
            LOG_INF("%x added to buffer, %d new size", *rfid_tag, buffer->size);
        }
        k_sem_give(&buffer_semaphore);
        k_msleep(1000);
    }
}

//main functions is used for setup code
int main(void){
    int err = 0;

    LOG_INF("Initializing NFC");
    err = pn532_nfc_setup();
    if (err){
        LOG_ERR("NFC setup failed, error: %d", err);
    }
	err = network_init();
    if (err) {
        LOG_ERR("Network init error: %d", err);
    }

    k_sem_give(&tag_reader_semaphore);
    k_sem_give(&keepalive_semaphore);
    k_sem_give(&publish_semaphore);
    return 0;
}

//define and start the two threads at their corresponding entrypoints
K_THREAD_DEFINE(thread0_id, 1024, mqtt_keepalive_thread, &passing_buffer, &rfid_tag1, NULL,
		4, 0, 1000);
K_THREAD_DEFINE(thread1_id, 1024, tag_reader_thread, &passing_buffer, &rfid_tag2, &passing_time1,
		6, 0, 1000);
K_THREAD_DEFINE(thread2_id, 2048, publish_thread, &passing_buffer, &rfid_tag2, &passing_time2,
		5, 0, 10000);
