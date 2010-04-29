/* A module for handling dynamically growable strings without embedded
   null characters. Only functions that could potentially involve
   growing are defined; in all others cases standard library functions
   work fine (eg strcmp). All const parameters can take a C string,
   except the one in string_length.

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

#ifndef _PRESTRING_H_
#define _PRESTRING_H_

/* Expands the given string's capacity to at least size, not including
   null character. */
char* string_ensure_capacity(char** str, int size);

/* Creates a string containing the data in the given C string. */
char* string_new(const char* cstring);

/* Gets length of a growable string in constant time. */
int string_length(const char* str);

/* Chops the string down to length length, removing part of the end. */
void string_truncate(char* str, int length);

/* Copies the contents of one string into another. */
char* string_copy_internal(char** dst, const char* src);
#define string_copy(dst, src) (string_copy_internal(&(dst),(src)))

/* Concatenates contents of src onto end of dst. */
char* string_cat_internal(char** dst, const char* src);
#define string_cat(dst, src) (string_cat_internal(&(dst),(src)))

/* Concatenates a single character onto end of dst. */
char* string_ccat_internal(char** dst, const char src);
#define string_ccat(dst, src) (string_ccat_internal(&(dst),(src)))

/* Prints formatted data into a string. */
char* string_printf(char** dst, const char* format, ...);

/* Reads a line of any length from a stream */
void string_fget_internal(char** dst, FILE* stream);
#define string_fget(dst, stream) (string_fget_internal(&(dst),(stream)))

/* Destroys the string's contents and the string, freeing all memory
   it's using. */
void string_destroy(char* str);

#endif /* #ifndef _PRESTRING_H_ */
