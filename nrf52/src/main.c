#include <zephyr/kernel.h>
#include <zephyr/device.h>
#include <zephyr/devicetree.h>
#include <zephyr/drivers/i2c.h>
#include <zephyr/sys/util.h>
#include <zephyr/sys/printk.h>

//I2C stuff
#define I2C1_NODE DT_NODELABEL(i2c1)

#define PN532_I2C_ADDRESS 0x24

#define PN532_I2C_CONTROL_REGISTER 0xD8
#define PN532_I2C_STATUS_REGISTER 0xD9
#define PN532_I2C_DATA_REGISTER 0xDA
#define PN532_I2C_ADDRESS_REGISTER 0xDB

static const struct device *i2c1_dev = DEVICE_DT_GET(I2C1_NODE);

static uint8_t buf[8];

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
uint8_t getGeneralStatus[9] = {
    0x00, //preamble
    0x00, // 0x00FF command start
    0xFF, 
    2, //data length
    0xFE, //data length checksum
    0xD4, //D4= host -> PN532
    0x04, //get general status command code
    0x28, //data checksum
    0x00, //postamble
    };
uint8_t RFfieldOn[11] = {
    0x00, //preamble
    0x00, // 0x00FF command start
    0xFF, 
    4, //data length
    0xFC, //data length checksum
    0xD4, //D4= host -> PN532
    0x32, //RF configuration command
    0x01, //RF field
    0x03, //turn RF field on
    0xF6, //data checksum
    0x00, //postamble
    };
uint8_t InJumpForDEP[12] = {
    0x00, //preamble
    0x00, // 0x00FF command start
    0xFF, 
    5, //data length
    0xFB, //data length checksum
    0xD4, //D4= host -> PN532
    0x56, //command code
    0x00, //ACTPASS
    0x00, //BR
    0x00, //NEXT
    0xD6, //data checksum
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
    0x14, //timeout
    0x00, //dont use IRQ
    0x03, //data checksum
    0x00, //postamble
};

#define TAG_DETECTION_COOLDOWN 1000

void print_bytes(uint8_t bytes[], uint32_t len){
    for(int i = 0; i < len; i++){
        printk("%02X ", bytes[i]);
    }
}

int PN532_wait_for_RDY(){
    uint8_t buf[1];
    int ret;
    for(int i = 0; i < 100; i++){
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
        printk("msg sent\n");
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
        printk("response read\n");
    }

    return 0;

}

int pn532_nfc_setup(){
    int ret;

    uint8_t res_buf[30];
    
    /*ret = pn532_send_receive_message(i2c1_dev, PN532_I2C_ADDRESS, RFfieldOn, 11, res_buf, 30, false);
    if(ret){
        printk("send/receive error: %d\n", ret);
    }*/
    //printk("recieved: ");
    //print_bytes(res_buf, 30);
    //printk("\n");


    ret = pn532_send_receive_message(i2c1_dev, PN532_I2C_ADDRESS, SamConfig, 12, res_buf, 30, false);
    if(ret){
        printk("send/receive error: %d\n", ret);
    }
}

int pn532_get_tag_loop(){

    while (1){

        int ret;
        
        uint8_t res_buf[30];

        ret = pn532_send_receive_message(i2c1_dev, PN532_I2C_ADDRESS, command, 11, res_buf, 30, false);

        if(ret == -4){
            printk("No tag detected\n");
        }else if (ret){
            printk("some i2c error: %d\n", ret);
            return -1;
        }else{
            uint8_t length = res_buf[13];
            printk("tag detected, UID: ");
            print_bytes(res_buf+14, length);
            printk("\n");
            k_msleep(TAG_DETECTION_COOLDOWN);
        }
    }
    return 0;
}

int main(void)
{
    int ret;


    if (!device_is_ready(i2c1_dev)) {
        printk("i2c device is not ready\n");
        return 1;
    }

    pn532_nfc_setup();
    pn532_get_tag_loop();

    return 0;
}
