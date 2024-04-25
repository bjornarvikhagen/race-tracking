#ifndef _PASSING_BUFFER_H_
#define _PASSING_BUFFER_H_

#define BUFFER_SIZE 128
#define RFID_STR_LEN 8


struct passing_buffer{
    int front;
    int back;
    int size;
    int rfid_buffer[BUFFER_SIZE];
    int time_buffer[BUFFER_SIZE]; 
};

int enqueue(struct passing_buffer *q, uint32_t* rfid, uint64_t *time);
int dequeue(struct passing_buffer *q, uint32_t* rfid, uint64_t *time);
int size(struct passing_buffer *q);

#endif

