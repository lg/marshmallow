#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "simple_templates.h"

DEFINE_HASH(string_string, char*, char*, hash_string, string_equal)

// A string hashing function, borrowed from Emacs 19.34
int hash_string(const char* str, const int hash_size) {
  int hash = 0;
  int i;

  for (i=0; str[i] != '\0'; i++) {
	  char c = str[i];
	  if (c >= 0140)
      c -= 40;
	  
	  hash = (hash<<3) + (hash>>28) + c;
  }
  
  return (hash & 07777777777) % hash_size;
}

int string_equal(const char* str1, const char* str2) {
  return strcmp(str1, str2) == 0;
}

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

// TODO: do not return a prestring, but rather a char array
prestring st_apply(char *template, string_string_hash values) {
  prestring out = string_new("");
  char *max = template + strlen(template);
  
  // Restart and parse out data
  char *x = template;
  char *last_x = template;
  while (x < max) {
    if (!(x = strstr(last_x, "{{"))) 
      x = max;

    // Insert the static text
    size_t len = x - last_x;
    char *item = malloc(len + 1);
    memcpy(item, last_x, len);
    item[len] = 0x00;
    string_cat(out, item);
    
    // Insert the replaced text
    char *y = strstr(x, "}}");
    if (y > 0) {
      len = y - x - 2;
      char *variable = malloc(len + 1);
      memcpy(variable, x + 2, len);
      variable[len] = 0x00;
      
      // Lookup the variable
      char **replace_with = string_string_hash_get(values, variable);
      if (*replace_with != NULL) {
        string_cat(out, *replace_with);
      }
    }
    
    last_x = y + 2;
  }

  return out;
}