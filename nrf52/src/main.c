#include <zephyr/kernel.h>
#include <zephyr/device.h>
#include <zephyr/devicetree.h>
#include <zephyr/drivers/i2c.h>
#include <zephyr/sys/util.h>
#include <zephyr/sys/printk.h>
#include "nfc.h"
#include "passing_buffer.h"


struct passing_buffer passing_buffer;

//Semaphore for ensuring no problems with the shared memory
K_SEM_DEFINE(buffer_semaphore, 1, 1);

uint32_t rfid_tag1;
uint32_t rfid_tag2;

void network_thread(struct passing_buffer *buffer, uint32_t *rfid_tag){

    

    while(1){



        if (size(buffer)){

            k_sem_take(&buffer_semaphore, K_FOREVER);

            dequeue(buffer, rfid_tag);

            k_sem_give(&buffer_semaphore);

            //TODO: send rfid tag to the MQTT broker

            k_msleep(1000);//simulate poor connection

            printk("rfid tag: %X\n", *rfid_tag);
        }

        

    }
}

void tag_reader_thread(struct passing_buffer *buffer, uint32_t *rfid_tag){


    while(1){

        int ret = pn532_get_tag(rfid_tag);

        k_sem_take(&buffer_semaphore, K_FOREVER);
        if (ret == 0) {
            enqueue(buffer, rfid_tag);
            printk("%x added to buffer\n", *rfid_tag);

            k_msleep(200);
        }
        k_sem_give(&buffer_semaphore);
    }
}


//define and start the two threads at their corresponding entrypoints
K_THREAD_DEFINE(thread0_id, 2048, network_thread, &passing_buffer, &rfid_tag1, NULL,
		7, 0, 1000);
K_THREAD_DEFINE(thread1_id, 2048, tag_reader_thread, &passing_buffer, &rfid_tag2, NULL,
		6, 0, 1000);


//main functions is used for setup code
int main(){
    int ret = pn532_nfc_setup();
    if (ret){
        printk("Setup failed");
    }else{
        printk("Setup complete\n");
    }
    k_msleep(1000000);
    return 0;
}