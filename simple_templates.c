#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "simple_templates.h"

char *read_text_file(char *filename) {
  FILE *file = fopen(filename, "r");
  if (!file) {
    fprintf(stderr, "Unable to open file: %s\n", filename);
    exit(1);
  }

  // Get the file size to allocate the right memory size for it.
  fseek(file, 0, SEEK_END);
  long size = ftell(file);
  fseek(file, 0, SEEK_SET);

  char *file_data = malloc(size + 1);
  file_data[size] = 0x00;

  // Read exactly the file size of data  
  if (size > 0 && !fread(file_data, size, 1, file)) {
    fprintf(stderr, "Error reading file: %s\n", filename);
    exit(1);
  }

  fclose(file);
  return file_data;
}

sized_array st_prepare(char *template_file) {
  char *template = read_text_file(template_file);
  
  // Count total items
  sized_array items;
  items.size = 0;
  
  char *x = template;
  char *last_x = template;
  while ((x = strstr(last_x, "{{"))) {
    items.size++;
    last_x = x + 2;
  }
  items.size = (items.size * 2) + 1;
  items.items = malloc(sizeof(char*) * items.size);
  items.sizes = malloc(sizeof(size_t) * items.size);
  
  // Loop through template and puts pointers to sections in
  int cur_item = 0;
  char *max = template + strlen(template);
  last_x = template;
  
  x = template;
  while (x < max) {
    if (!(x = strstr(last_x, "{{"))) 
      x = max;

    // Insert the static text
    size_t len = x - last_x;
    char *item = malloc(len + 1);
    memcpy(item, last_x, len);
    item[len] = 0x00;
    items.sizes[cur_item] = len;
    items.items[cur_item++] = item;
    
    // Insert the index for the replacement array
    char *y = strstr(x, "}}");
    if (y > 0) {
      len = y - x - 2;
      char *variable = malloc(len + 1);
      memcpy(variable, x + 2, len);
      variable[len] = 0x00;
   
      items.sizes[cur_item] = 0;
      items.items[cur_item++] = (char *)atol(variable);
      free(variable);
    }
    
    last_x = y + 2;
  }

  return items;
}