#include <stdio.h>
#include <stdlib.h>

#include <event.h>
#include <evhttp.h>

void http_handler(struct evhttp_request *req, void *arg) {
  struct evbuffer *evbuf = evbuffer_new();
  
  // Generic reply for nows
  evbuffer_add_printf(evbuf, "fuck off, asshole");
  evhttp_send_reply(req, HTTP_OK, "OK", evbuf);
  
  evbuffer_free(evbuf);
  return;
}

int main(void) {
  printf("Marshmallow 0.01 by Larry Gadea (trivex@gmail.com)\n\n");
    
  // Start the server
  event_init();
  struct evhttp *server = evhttp_start("0.0.0.0", 8080);
  if (!server) {
    fprintf(stderr, "Failed to start server!");
    exit(1);
  }
  
  // Listen for connections
  evhttp_set_gencb(server, http_handler, NULL);
  fprintf(stderr, "Marshmallow is running on port 8080...\n");
  event_dispatch();
  
  exit(0);
}