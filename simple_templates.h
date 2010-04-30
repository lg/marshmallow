#ifndef _SIMPLE_TEMPLATES_H_
#define _SIMPLE_TEMPLATES_H_

typedef struct {
  size_t size;
  size_t *sizes;
  char* *items;
} sized_array;

sized_array st_prepare(char *template_file);

char *read_text_file(char *filename);
//prestring st_apply(char *template, string_string_hash values);

#endif