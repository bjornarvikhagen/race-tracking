#include <zephyr/kernel.h>
#include <zephyr/device.h>
#include <zephyr/devicetree.h>
#include <zephyr/drivers/i2c.h>
#include <zephyr/sys/util.h>
#include <zephyr/logging/log.h>
#include "nfc.h"
#include "passing_buffer.h"

#define PN532_I2C_ADDRESS 0x24

LOG_MODULE_DECLARE(PathPatrol);

//I2C stuff
#define I2C1_NODE DT_NODELABEL(i2c1)
static const struct device *i2c1_dev = DEVICE_DT_GET(I2C1_NODE);

uint8_t command[11] = {
    0x00, //preamble
    0x00, // 0x00FF command start
    0xFF, 
    4, //data length
    0xFC, //data length checksum

    0xD4, //D4= host -> PN532
    0x4A, //comand code for InListPassiveTarget
    0x01, //return 1 target
    0x00, //scan for Type A

    0xE1, //data checksum
    0x00, //postamble
    };
uint8_t SamConfig[12] = {
    0x00, //preamble
    0x00, // 0x00FF command start
    0xFF, 
    5, //data length
    0xFB, //data length checksum

    0xD4, //D4= host -> PN532
    0x14, //command code
    0x01, //normal mode
    0x00, //timeout: 00->no timeout
    0x01, //use IRQ

    0x16, //data checksum
    0x00, //postamble
};

void print_bytes(uint8_t bytes[], uint32_t len){
    for(int i = 0; i < len; i++){
        printk("%02X ", bytes[i]);
    }
}

int PN532_wait_for_RDY(){
    uint8_t buf[1];
    int ret;
    for(int i = 0; i < 500; i++){
        //give time
        k_msleep(20);

        ret = i2c_read(i2c1_dev, buf, 1, PN532_I2C_ADDRESS);
        if(ret){
            return -2;
        }

        if(buf[0] == 1){
            return 0;
        }
    }
    return -1;
}
/**
 * @brief Attempts to send a command to the pn532 and waits for the response 
 * 
 * @param dev Pointer to the device structure for an I2C controller driver configured in controller mode.
 * @param i2c_address i2c address of the pn532
 * @param msg Memory pool from which the data is transferred.
 * @param msg_len Amount of bytes in data to be transferred
 * @param res_buf Memory pool to store ressponse
 * @param res_buf_len Amount of bytes in response
 * @param verbose prints debugging information
 * @return int 0 if success, negative if failed
 */
int pn532_send_receive_message(struct device *dev, uint8_t i2c_address, uint8_t *msg, uint32_t msg_len, uint8_t *res_buf, uint32_t res_buf_len, bool verbose){
    int ret;


    ret = i2c_write(dev, msg, msg_len, i2c_address);
    if (ret){
        return -1; //write error
    }

    if (verbose){
        printk("Msg sent\n");
    }

    ret = PN532_wait_for_RDY();
    if (ret){
        return -3+ret; //RDY wait error
    }

    if (verbose){
        printk("RDY\n");
    }

    ret = i2c_read(dev, res_buf, 7, i2c_address); //check for ACK
    if(ret){
        return -2; // read error
    }

    if (verbose){
        printk("Ack recieved\n");
    }

    ret = PN532_wait_for_RDY();
    if (ret){
        return -3+ret; //RDY wait error
    }

    if (verbose){
        printk("RDY\n");
    }

    ret = i2c_read(dev, res_buf, res_buf_len, i2c_address); //read response message
    if(ret){
        return -2; // read error
    }
    
    if (verbose){
        printk("Response read\n");
    }

    return 0;
}

int pn532_nfc_setup(){
    int ret;

    uint8_t res_buf[30];

    ret = pn532_send_receive_message(i2c1_dev, PN532_I2C_ADDRESS, SamConfig, 12, res_buf, 30, false);
    if(ret){
        LOG_ERR("Send/Receive error: %d\n", ret);
        return ret;
    }
}

int pn532_get_tag(uint32_t *rfid_tag_buffer){
    int ret;
    
    uint8_t res_buf[30];

    ret = pn532_send_receive_message(i2c1_dev, PN532_I2C_ADDRESS, command, 11, res_buf, 30, false);


    if(ret == -4){
        return ret;
    }else if (ret){
        return -1;
    }else{
        uint8_t length = res_buf[13];
        *rfid_tag_buffer = (int)res_buf[14] << 24 | (int)res_buf[15] << 16 | (int)res_buf[16] << 8 | (int)res_buf[17];
        return 0;
    }
}
