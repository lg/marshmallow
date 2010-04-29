/* Implementation of the functions declared in prestring.h. The actual
   type of prestrings is also declared here; outsiders need never see it.

   For latest version see: http://moonflare.com/code/ctl/prestring.php

   Copyright (c) 2003, Derrick Coetzee
   All rights reserved.

   Redistribution and use in source and binary forms, with or without
   modification, are permitted provided that the following conditions
   are met:

   - Redistributions of source code must retain the above copyright
     notice, this list of conditions and the following disclaimer.

   - Redistributions in binary form must reproduce the above copyright
     notice, this list of conditions and the following disclaimer in
     the documentation and/or other materials provided with the
     distribution.

   - The name of Derrick Coetzee may not be used to endorse or promote
     products derived from this software without specific prior
     written permission.

   This software is provided by the copyright holders and contributors
   "as is" and any express or implied warranties, including, but not
   limited to, the implied warranties of merchantability and fitness
   for a particular purpose are disclaimed. In no event shall the
   copyright owner or contributors be liable for any direct, indirect,
   incidental, special, exemplary, or consequential damages
   (including, but not limited to, procurement of substitute goods or
   services; loss of use, data, or profits; or business interruption)
   however caused and on any theory of liability, whether in contract,
   strict liability, or tort (including negligence or otherwise)
   arising in any way out of the use of this software, even if advised
   of the possibility of such damage.
*/

#include <string.h>
#include <stdlib.h>
#include <stdarg.h>
#include <stdio.h>
#include "prestring.h"

/* This is a traditional C hack. We allocate however much space we
   want for the string, plus space for the other data. A pointer into
   the middle of the structure then acts like a normal C string, but
   has the metadata preceding it. */
typedef struct
{
    int capacity;
    int length;
    char string[1];
} prestring;

#define PRESTRING_OFFSET  (2*sizeof(int))

prestring* pointer_to_prestring(char* pointer)
{
    return (prestring *)(pointer - PRESTRING_OFFSET);
}

const prestring* pointer_to_prestring_const(const char* pointer)
{
    return (prestring *)(pointer - PRESTRING_OFFSET);
}

char* prestring_to_pointer(prestring* prestr)
{
    return ((char *)prestr) + PRESTRING_OFFSET;
}

/* Expands the given string's capacity to at least n, not
   including null character. */
char* string_ensure_capacity(char** str, int size)
{
    prestring* prestr = pointer_to_prestring(*str);
    prestring* oldstr = prestr;
    /* If not big enough or way too big, reallocate */
    if (prestr->capacity < size  ||  prestr->capacity/4 > size)
    {
	prestr->capacity = 3*size/2;
        prestr = (prestring*)realloc(prestr, 3*size/2 + PRESTRING_OFFSET + 1);
    }
    *str = prestring_to_pointer(prestr);
    if (prestr == NULL)
	free(oldstr);
    return *str;
}

/* Creates a string containing the data in the given C string. */
char* string_new(const char* cstring)
{
    int length = strlen(cstring);

    prestring* prestr =
	(prestring*)malloc(length + PRESTRING_OFFSET + 1);
    prestr->length = prestr->capacity = length;

    if (prestr == NULL)
	return NULL;
    return strcpy(prestring_to_pointer(prestr), cstring);
}

/* Gets length of a growable string in constant time. */
int string_length(const char* str)
{
    return pointer_to_prestring_const(str)->length;
}

/* Removes a portion of the end of the string to make it a certain length */
void string_truncate(char* str, int length)
{
    if (length < string_length(str))
    {
	str[length] = '\0';
	pointer_to_prestring(str)->length = length;
    }
}

/* Copies the contents of one string into another. */
char* string_copy_internal(char** dst, const char* src)
{
    int length = strlen(src);
    if (string_ensure_capacity(dst, length) == NULL)
	return NULL;
    
    pointer_to_prestring(*dst)->length = length;
    return strcpy(*dst, src);
}

/* Concatenates contents of src onto end of dst. */
char* string_cat_internal(char** dst, const char* src)
{
    int length = string_length(*dst) + strlen(src);
    if (string_ensure_capacity(dst, length) == NULL)
	return NULL;

    pointer_to_prestring(*dst)->length = length;
    return strcat(*dst, src);
}

/* Concatenates a single character onto end of dst. */
char* string_ccat_internal(char** dst, const char src)
{
    int length = string_length(*dst) + 1;

    if (src == '\0')
	return *dst;
    if (string_ensure_capacity(dst, length) == NULL)
	return NULL;

    pointer_to_prestring(*dst)->length = length;
    dst[0][length-1] = src;
    dst[0][length]   = '\0';
    return *dst;
}

/* Prints formatted data into a string. */
char* string_printf(char** dst, const char* format, ...)
{
    va_list marker;

    char dummy[2] = "";
    int length;
    va_start(marker, format);
    length = vsnprintf(dummy, 1, format, marker);
    va_end(marker);

    if (string_ensure_capacity(dst, length) == NULL)
	return NULL;

    pointer_to_prestring(*dst)->length = length;
    va_start(marker, format);
    vsprintf(*dst, format, marker);
    va_end(marker);

    return *dst;
}

/* Reads a line of any length from a stream */
void string_fget_internal(char** dst, FILE* stream)
{
    int capacity = 10;
    int length = 0;
    string_copy(*dst, "");
    if (string_ensure_capacity(dst, capacity) == NULL)
	return;

    for(;;)
    {
	if (fgets((*dst) + length, capacity + 1 - length, stream) == NULL)
	    break; /* EOF and no bytes read (or error), done */

	length = strlen(*dst);
	if (length < capacity  ||  (*dst)[length-1] == '\n')
	    break; /* Reached end-of-line or end-of-file */

	/* Still some line left. Expand and grab more. */
	capacity *= 2;
	if (string_ensure_capacity(dst, capacity) == NULL)
	    return;
    }

    pointer_to_prestring(*dst)->length = length;
}

/* Destroys the string's contents and the string, freeing all memory
   it's using. */
void string_destroy(char* str)
{
    if (str != NULL)
	free(pointer_to_prestring(str));
}
