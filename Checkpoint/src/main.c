#include <zephyr/kernel.h>
#include <zephyr/device.h>
#include <zephyr/devicetree.h>
#include <zephyr/drivers/i2c.h>
#include <zephyr/drivers/gpio.h>
#include <zephyr/sys/util.h>
#include <zephyr/sys/printk.h>

#include "nfc.h"
#include "passing_buffer.h"

#define SW0_NODE	DT_ALIAS(sw0)
#if !DT_NODE_HAS_STATUS(SW0_NODE, okay)
#error "Unsupported board: sw0 devicetree alias is not defined"
#endif

static const struct gpio_dt_spec button = GPIO_DT_SPEC_GET_OR(SW0_NODE, gpios,
							      {0});
static struct gpio_callback button_cb_data;



struct passing_buffer passing_buffer;

//Semaphore for ensuring no problems with the shared memory
K_SEM_DEFINE(buffer_semaphore, 1, 1);

uint32_t rfid_tag1;
uint32_t rfid_tag2;


void button_pressed(const struct device *dev, struct gpio_callback *cb,
		    uint32_t pins)
{
	printk("IRQ");
}


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


int button_setup(){
    int ret;

	if (!gpio_is_ready_dt(&button)) {
		printk("Error: button device %s is not ready\n",
		       button.port->name);
		return 0;
	}

	ret = gpio_pin_configure_dt(&button, GPIO_INPUT);
	if (ret != 0) {
		printk("Error %d: failed to configure %s pin %d\n",
		       ret, button.port->name, button.pin);
		return 0;
	}

	ret = gpio_pin_interrupt_configure_dt(&button,
					      GPIO_INT_EDGE_TO_ACTIVE);
	if (ret != 0) {
		printk("Error %d: failed to configure interrupt on %s pin %d\n",
			ret, button.port->name, button.pin);
		return 0;
	}

	gpio_init_callback(&button_cb_data, button_pressed, BIT(button.pin));
	gpio_add_callback(button.port, &button_cb_data);
	printk("Set up button at %s pin %d\n", button.port->name, button.pin);
}

//main functions is used for setup code
int main(){
    button_setup();
    int ret = pn532_nfc_setup();
    if (ret){
        printk("Setup failed");
    }else{
        printk("Setup complete\n");
    }
    k_msleep(1000000);
    return 0;
}