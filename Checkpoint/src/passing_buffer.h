#ifndef PASSING_BUFFER_H
#define PASSING_BUFFER_H

#define BUFFER_SIZE 128


struct passing_buffer{
    int front;
    int back;
    int size;
    int buffer[BUFFER_SIZE]; 
};

int enqueue(struct passing_buffer *q, uint32_t* rfid);
int dequeue(struct passing_buffer *q, uint32_t* rfid);
int size(struct passing_buffer *q);

#endif

