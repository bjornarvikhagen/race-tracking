#include <zephyr/sys/util.h>
#include "passing_buffer.h"

int enqueue(struct passing_buffer *q, uint32_t* rfid, uint64_t *time){
    if (q->size < BUFFER_SIZE){
        q->rfid_buffer[q->back] = *rfid;
        q->time_buffer[q->back] = *time;
        q->back = (q->back+1)%BUFFER_SIZE;
        q->size++;
    }
    return 0;
}

int dequeue(struct passing_buffer *q, uint32_t* rfid, uint64_t *time){
    if (q->size > 0) {
        *rfid = q->rfid_buffer[q->front];
        *time = q->time_buffer[q->front];
        q->front = (q->front+1)%BUFFER_SIZE;
        q->size--;
    }
    return 0;
}

int size(struct passing_buffer *q){
    return q->size;
}
