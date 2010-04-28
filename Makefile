CC=gcc
CARGS=-c -fasm-blocks -Wall --std=c99
LIBS=-levent -lsqlite3

marshmallow: main.o datastore.o
	$(CC) $(LIBS) -o $@ $^

main.o: main.c
	$(CC) $(CARGS) -c -o $@ $<

datastore.o: datastore.c datastore.h
	$(CC) $(CARGS) -c -o $@ $<

.PHONY: clean

clean:
	rm -f marshmallow *.o
