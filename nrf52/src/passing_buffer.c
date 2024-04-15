#include "passing_buffer.h"



int enqueue(struct passing_buffer *q, int rfid){
    if (q->size < BUFFER_SIZE){
        q->buffer[q->back] = rfid;
        q->back = (q->back+1)%BUFFER_SIZE;
    }
}

int dequeue(struct passing_buffer *q){
    if (q->size > 0) {
        int result = q->buffer[q->front];
        q->front = (q->front+1)%BUFFER_SIZE;
    }
}
