#include <zephyr/kernel.h>
#include <zephyr/device.h>
#include <zephyr/devicetree.h>
#include <zephyr/drivers/i2c.h>
#include <zephyr/sys/util.h>
#include <zephyr/sys/printk.h>
#include "nfc.h"

//I2C stuff
#define I2C1_NODE DT_NODELABEL(i2c1)

static const struct device *i2c1_dev = DEVICE_DT_GET(I2C1_NODE);

int main(void)
{
    if (!device_is_ready(i2c1_dev)) {
        printk("i2c Device is not ready\n");
        return 1;
    }

    pn532_nfc_setup();
    pn532_get_tag_loop();

    return 0;
}
