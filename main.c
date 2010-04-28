// Marshmallow, an opensource Campfire server, by Larry Gadea trivex@gmail.com
//
// To build and run, use: make && sudo ./marshmallow
//
// To connect, set "127.0.0.1 marshmallow.campfirenow.com" in your /etc/hosts file
// and connect to marshmallow.campfirenow.com in Propane.

#include <stdio.h>
#include <stdlib.h>

#include <event.h>
#include <evhttp.h>

// - Need http://127.0.0.1 as a constant
// - Need to actually parse templates as templates and not just read em in
// - Need to clean up handlers to use a common generator
// - Need to implement "proper" auth

char *template_room_list = NULL;
char *template_room = NULL;

char *static_sprockets_js = NULL;

void http_unknown_handler(struct evhttp_request *req, void *arg) {
  struct evbuffer *evbuf = evbuffer_new();
  
  // Generic reply for nows
  evbuffer_add_printf(evbuf, "THIS IS A REALLY AWESOME UNIMPLEMENTED PAGE");
  evhttp_send_reply(req, HTTP_OK, "OK", evbuf);
  
  evbuffer_free(evbuf);
  
  return;
}

// Handle /
void http_root_handler(struct evhttp_request *req, void *arg) {
  struct evbuffer *evbuf = evbuffer_new();
  
  // Use the "template" to output to the user. Obviously we'll need an
  // actual template parser in the future since this is uber stat.
  evbuffer_add_printf(evbuf, "%s", template_room_list);
  
  evhttp_add_header(req->output_headers, "Location", "/login");
  evhttp_send_reply(req, HTTP_OK, "Found", evbuf);
  evbuffer_free(evbuf);
}

// Handle /room/295440/
void http_room_handler(struct evhttp_request *req, void *arg) {
  struct evbuffer *evbuf = evbuffer_new();
  
  // Use the "template" to output to the user. Obviously we'll need an
  // actual template parser in the future since this is uber stat.
  evbuffer_add_printf(evbuf, "%s", template_room);
  
  evhttp_send_reply(req, HTTP_OK, "OK", evbuf);
  evbuffer_free(evbuf);
}

// Handle /room/295440/speak
void http_speak_handler(struct evhttp_request *req, void *arg) {
  struct evbuffer *evbuf = evbuffer_new();  
  evhttp_send_reply(req, HTTP_OK, "OK", evbuf);
  evbuffer_free(evbuf);
}

// Handle /sprockets.js
void http_sprockets_handler(struct evhttp_request *req, void *arg) {
  struct evbuffer *evbuf = evbuffer_new();
  
  // Write the static file to the user
  evbuffer_add_printf(evbuf, "%s", static_sprockets_js);
  
  evhttp_send_reply(req, HTTP_OK, "OK", evbuf);
  evbuffer_free(evbuf);
}


char *read_template(char *filename) {
  FILE *file = fopen(filename, "r");
  if (!file) {
    fprintf(stderr, "Unable to open template file: %s\n", filename);
    exit(1);
  }

  // Get the file size to allocate the right memory size for it
  fseek(file, 0, SEEK_END);
  long size = ftell(file);
  fseek(file, 0, SEEK_SET);
  char *file_data = malloc(size);
  
  // Read exactly the file size of data
  if (!fread(file_data, size, 1, file)) {
    fprintf(stderr, "Error reading template file: %s\n", filename);
    exit(1);
  }

  fclose(file);
  return file_data;
}

int main(void) {
  printf("Marshmallow 0.01 by Larry Gadea (trivex@gmail.com)\n\n");

  // Start the server
  event_init();
  struct evhttp *server = evhttp_start("0.0.0.0", 80);
  if (!server) {
    fprintf(stderr, "Failed to start server! This is probably because you didn't run as sudo and as such port 80 isn't available.\n");
    exit(1);
  }
  
  // Set up handlers for the different urls
  evhttp_set_gencb(server, http_unknown_handler, NULL);
  evhttp_set_cb(server, "/", http_root_handler, NULL);
  evhttp_set_cb(server, "/room/295440/", http_room_handler, NULL);
  evhttp_set_cb(server, "/room/295440/speak", http_speak_handler, NULL);
  
  evhttp_set_cb(server, "/sprockets.js", http_sprockets_handler, NULL);
  
  // Read in templates
  fprintf(stderr, "Reading templates...\n");
  template_room_list = read_template("templates/room_list.tpl");
  template_room = read_template("templates/room.tpl");
  
  static_sprockets_js = read_template("statics/sprockets.js");
  
  // Open the flood gates
  fprintf(stderr, "Listening for connections on port 80...\n");
  event_dispatch();

  exit(0);
}