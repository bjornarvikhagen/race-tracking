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

/* Semaphore for mutexing the shared RFID buffer. */
K_SEM_DEFINE(buffer_semaphore, 1, 1);

/* Semaphores for preventing thread execution before initializations in the main() thread have finished. */
K_SEM_DEFINE(publish_semaphore, 0, 1);
K_SEM_DEFINE(keepalive_semaphore, 0, 1);
K_SEM_DEFINE(tag_reader_semaphore, 0, 1);

/** @brief Entrypoint function for the NFC tag reader thread. This function never returns.
 *  @param buffer The passing_buffer to enqueue RFID reads to.
*/
void tag_reader_thread(struct passing_buffer *buffer) {
    k_sem_take(&tag_reader_semaphore, K_FOREVER); // wait for main

    uint32_t rfid_tag = 0;
    uint64_t time = 0;
    while(1) {
        int ret = pn532_get_tag(&rfid_tag);

        k_sem_take(&buffer_semaphore, K_FOREVER);
        if (ret == 0) {
            time = (k_cycle_get_32()*1000)/sys_clock_hw_cycles_per_sec();
            enqueue(buffer, &rfid_tag, &time);
            LOG_INF("%x added to buffer, %d new size", rfid_tag, buffer->size);
        }
        k_sem_give(&buffer_semaphore);
        k_msleep(CONFIG_MQTT_NFC_SCAN_TIMER_MS);
    }
}

/** @brief Main entry point, initializes code, then returns to kill the main thread.
 *  @returns Non-zero value on error, 0 if success.
*/
int main(void){
    int err;

    LOG_INF("Initializing NFC");
    err = pn532_nfc_setup();
    if (err){
        LOG_ERR("NFC setup failed, error: %d", err);
        return err;
    }
	err = network_init();
    if (err) {
        LOG_ERR("Network init error: %d", err);
        return err;
    }
    
    LOG_INF("Giving tag_reader_semaphore.");
    k_sem_give(&tag_reader_semaphore);
    LOG_INF("Giving keepalive_semaphore.");
    k_sem_give(&keepalive_semaphore);
    LOG_INF("Giving publish_semaphore.");
    k_sem_give(&publish_semaphore);
    return 0;
}

// Define and start the three threads at their corresponding entrypoints.
K_THREAD_DEFINE(thread0_id, 1024, mqtt_keepalive_thread, NULL, NULL, NULL,
		4, 0, 1000);
K_THREAD_DEFINE(thread1_id, 1024, tag_reader_thread, &passing_buffer, NULL, NULL,
		6, 0, 1000);
K_THREAD_DEFINE(thread2_id, 2048, publish_thread, &passing_buffer, NULL, NULL,
		5, 0, 10000);
