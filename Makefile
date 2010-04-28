CC=gcc
CARGS=-c -fasm-blocks -Wall --std=c99
LIBS=-levent

marshmallow: main.o
	$(CC) $(LIBS) -o $@ $^

main.o: main.c main.h
	$(CC) $(CARGS) -c -o $@ $<

.PHONY: clean

clean:
	rm -f marshmallow *.o
