char *template_room_list = NULL;

// Reads a file and forever stores it in memory. Use free() to clear
// the pointer once you're done with it.
char *read_file(char *filename);

// Handle /
void http_root_handler(struct evhttp_request *req, void *arg);

// Handle all static assets
void add_static(struct evhttp *server, char *uri, char *local_path);
void http_statics_handler(struct evhttp_request *req, void *arg);