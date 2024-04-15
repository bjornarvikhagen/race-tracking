#include <zephyr/kernel.h>
#include <zephyr/device.h>
#include <zephyr/devicetree.h>
#include <zephyr/drivers/i2c.h>
#include <zephyr/sys/util.h>
#include <zephyr/sys/printk.h>
#include "nfc.h"
#include "passing_buffer.h"


uint32_t rfid_tag_buffer[1000] = { 0 }; //Shared buffer between the network thread and the tag reading thread

//Semaphores for ensuring no problems with the shared memory
K_SEM_DEFINE(start_producer_semaphore, 1, 1);
K_SEM_DEFINE(start_consumer_semaphore, 0, 1);

void network_thread(uint32_t *rfid_buffer){

    int index = 0;
    while(1){
        k_sem_take(&start_consumer_semaphore, K_FOREVER);

        printk("%x\n", rfid_buffer[index]);
        index++;
        //TODO: send first in queue entry to the MQTT broker

        k_sem_give(&start_producer_semaphore);
    }
}

void tag_reader_thread(uint32_t *rfid_buffer){

    int index = 0;
    while(1){
        k_sem_take(&start_producer_semaphore, K_FOREVER);
        int ret = pn532_get_tag(rfid_buffer, index);

        if (ret == 0) {
            //a tag has been detected, notify the network thread that a new rfid tag is ready to be sent
            index++;
            k_sem_give(&start_consumer_semaphore);
            k_msleep(500);
        }else{
            //no tag was detected, re-listen
            k_sem_give(&start_producer_semaphore);
        }
    }
}

//define and start the two threads at their corresponding entrypoints
K_THREAD_DEFINE(thread0_id, 2048, network_thread, rfid_tag_buffer, NULL, NULL,
		7, 0, 0);
K_THREAD_DEFINE(thread1_id, 2048, tag_reader_thread, rfid_tag_buffer, NULL, NULL,
		6, 0, 0);


//main functions is used for setup code
int main(){
    pn532_nfc_setup();
    return 0;
}