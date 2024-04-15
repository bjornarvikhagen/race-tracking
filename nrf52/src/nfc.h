#ifndef NFC_H
#define NFC_H

void print_bytes(uint8_t bytes[], uint32_t len);
int PN532_wait_for_RDY();
int pn532_send_receive_message(struct device *dev, uint8_t i2c_address, uint8_t *msg, uint32_t msg_len, uint8_t *res_buf, uint32_t res_buf_len, bool verbose);
int pn532_nfc_setup();
int pn532_get_tag_loop(uint32_t *rfid_tag_buffer);
int pn532_get_tag(uint32_t *rfid_tag_buffer, int index);

#endif