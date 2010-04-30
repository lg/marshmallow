CC=gcc
CARGS=-c -fasm-blocks -Wall --std=c99
LIBS=-levent -lsqlite3

marshmallow: main.o datastore.o simple_templates.o
	$(CC) $(LIBS) -g -o $@ $^

main.o: main.c
	$(CC) $(CARGS) -g -c -o $@ $<

datastore.o: datastore.c datastore.h
	$(CC) $(CARGS) -g -c -o $@ $<

simple_templates.o: simple_templates.c simple_templates.h
	$(CC) $(CARGS) -g -c -o $@ $<

.PHONY: clean

clean:
	rm -f marshmallow *.o
