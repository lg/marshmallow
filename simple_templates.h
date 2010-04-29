#ifndef _SIMPLE_TEMPLATES_H_
#define _SIMPLE_TEMPLATES_H_

#include "extern/hash.h"
#include "extern/prestring.h"

// Creates the string_string_hash type (with hasher and comparator)
int hash_string(const char* str, const int hash_size);
int string_equal(const char* str1, const char* str2);
DECLARE_HASH(string_string, char*, char*)

typedef char* prestring;

char *read_text_file(char *filename);
prestring st_apply(char *template, string_string_hash values);

#endif