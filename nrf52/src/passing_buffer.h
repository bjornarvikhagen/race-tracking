#define BUFFER_SIZE 128


struct passing_buffer{
    int front;
    int back;
    int size;
    int buffer[BUFFER_SIZE]; 
};

int enqueue(struct passing_buffer *q, int rfid);
int dequeue(struct passing_buffer *q);

