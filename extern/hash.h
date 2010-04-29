/* A "template" for a hash map module that stores the data in
   the buckets, implemented in a typesafe way. Uses chaining for
   collision resolution to avoid reserving a particular key value.

   For latest version see: http://moonflare.com/code/ctl/hash.php

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

#ifndef _HASH_H_
#define _HASH_H_

#include <stdlib.h> /* malloc, free */
#include "list.h"

/* Put this in a header file */
#define DECLARE_HASH(prefix, keytype, valuetype) \
 \
/* This is a single pair in the map, holding the key and value. */ \
typedef struct \
{ \
    keytype key; \
    valuetype value; \
} prefix##_hash_pair; \
 \
DECLARE_LIST(prefix##_hash_pair, prefix##_hash_pair) \
 \
/* This describes the hash table as a whole. */ \
typedef struct \
{ \
    int entries; /* Number of data in table */ \
    int size;    /* Size of table array */ \
    prefix##_hash_pair_list* table; \
} prefix##_hash; \
 \
/* This is an opaque structure to be used when iterating through \
   the hash. It tracks both the current bucket and position in that \
   bucket. */ \
typedef struct \
{ \
    prefix##_hash* hash; \
    int table_index; \
    prefix##_hash_pair_list_iterator current; \
} prefix##_hash_iterator; \
 \
/* Creates a new empty hash */ \
prefix##_hash prefix##_hash_new(); \
/* Reallocates hash table to optimal size for count elements. \
   Rehashes all existing elements. Very expensive!  */ \
void prefix##_hash_resize(prefix##_hash* hash, const int count); \
/* Clears out entire hash, call this when done with it. */ \
void prefix##_hash_clear(prefix##_hash* hash); \
\
/* Adds a key/value pair, or replaces value of existing key. */ \
void prefix##_hash_set(prefix##_hash* hash, keytype key, valuetype value); \
/* Returns nonzero iff a key/value pair with the given key is in the hash. */ \
int prefix##_hash_contains_key(const prefix##_hash hash, const keytype key); \
/* Gets pointer to value corresponding to given key, NULL if key not found. */ \
valuetype* prefix##_hash_get(const prefix##_hash hash, const keytype key); \
/* Removes key/value pair with given key, if present, else does nothing. */ \
void prefix##_hash_remove(prefix##_hash* hash, const keytype key); \
 \
/* See the HASH_ITERATE macro to do typical iteration */ \
/* Gets an iterator positioned at the first element of the hash. */ \
prefix##_hash_iterator prefix##_hash_first(prefix##_hash* hash); \
/* Updates an iterator to point to the next element of the hash. */ \
void prefix##_hash_next(prefix##_hash_iterator* iter); \
/* Returns nonzero iff iterator points beyond last element of hash. */ \
int prefix##_hash_done(const prefix##_hash_iterator iter); \
 \
/* Retrieves pointer to key at position of given iterator */ \
keytype* prefix##_hash_key(const prefix##_hash_iterator iter); \
/* Retrieves pointer to value at position of given iterator */ \
valuetype* prefix##_hash_value(const prefix##_hash_iterator iter); \
/* Removes key/value pair at position of given iterator, \
   moving the iterator to the next pair. */ \
void prefix##_hash_remove_iterator(prefix##_hash_iterator* iter); \
\
/* Returns nonzero iff hash is empty (contains no elements). */ \
int prefix##_hash_empty(const prefix##_hash hash); \
\
/* END DECLARE */

/* Iterates through hash whose type was created with the given prefix,
   creating a new iterator iter visible in the given loop body. hash
   must be addressable. */
#define HASH_ITERATE(prefix, hash, iter, body) \
{ \
   prefix##_hash_iterator iter = prefix##_hash_first(&hash); \
   for( ; !prefix##_hash_done(iter); prefix##_hash_next(&iter)) \
   { \
       body; \
   } \
}

/* Put this in a source file */
/* Prefix, keytype, valuetype same as for DECLARE_HASH.
   hashfunc is of form int hashfunc(keytype key, int table_size);
      It hashes a key to some integer >= 0 but < table_size.
   equalfunc is of form int equalfunc(keytype key1, keytype key2);
      Returns nonzero if and only if key1 represents the same value as key2.
*/
#define DEFINE_HASH(prefix, keytype, valuetype, hashfunc, equalfunc) \
 \
DEFINE_LIST(prefix##_hash_pair, prefix##_hash_pair) \
 \
/* Creates a new empty hash initially designed to hold <count> items. */ \
prefix##_hash prefix##_hash_new() \
{ \
    prefix##_hash new_hash; \
    new_hash.entries = 0; \
    new_hash.size    = 0; \
    new_hash.table   = NULL; \
    return new_hash; \
} \
 \
/* Reallocates hash table to optimal size for count elements. \
   Rehashes all existing elements. Very expensive!  */ \
void prefix##_hash_resize(prefix##_hash* hash, int count) \
{ \
    int size = count*6/5 + 2; /* 20% larger, +2 in case count very small */ \
 \
    prefix##_hash new_hash; \
    new_hash.entries = 0; \
    new_hash.size    = size; \
    new_hash.table = (prefix##_hash_pair_list *) \
	                 malloc(size * sizeof(prefix##_hash_pair_list)); \
    { \
	int i; \
	for(i=0; i<size; i++) \
	    new_hash.table[i] = prefix##_hash_pair_list_new(); \
    } \
 \
    HASH_ITERATE(prefix, *hash, iter, \
	prefix##_hash_set(&new_hash, *prefix##_hash_key(iter), \
			             *prefix##_hash_value(iter)); \
    ) \
 \
    prefix##_hash_clear(hash); \
    *hash = new_hash; \
} \
 \
/* Clears out entire hash, call this when done with it. */ \
void prefix##_hash_clear(prefix##_hash* hash) \
{ \
    int i; \
    for (i=0; i < hash->size; i++) \
    { \
	prefix##_hash_pair_list_clear(&hash->table[i]); \
    } \
    free(hash->table); \
    *hash = prefix##_hash_new(); \
} \
 \
/* Adds a key/value pair, or replaces value of existing key. */ \
void prefix##_hash_set(prefix##_hash* hash, keytype key, valuetype value) \
{ \
    prefix##_hash_pair_list* bucket_chain; \
 \
    /* Enlarge hash if we're starting to fill up */ \
    if(hash->size < hash->entries*6/5 + 1) \
    { \
	prefix##_hash_resize(hash, hash->entries*2 + 10); \
    } \
 \
    bucket_chain = &hash->table[(hashfunc)(key, hash->size)]; \
    LIST_ITERATE(prefix##_hash_pair, *bucket_chain, iter, \
        prefix##_hash_pair* pair = prefix##_hash_pair_list_value(iter); \
        if ((equalfunc)(pair->key, key)) \
        { \
	    pair->value = value; \
	    return; \
        } \
    ) \
 \
    { \
	prefix##_hash_pair new_pair; \
	new_pair.key = key; \
	new_pair.value = value; \
	prefix##_hash_pair_list_push_front(bucket_chain, new_pair); \
	hash->entries++; \
    } \
} \
 \
/* Determines if a key/value pair with the given key is in the hash. */ \
int prefix##_hash_contains_key(const prefix##_hash hash, const keytype key) \
{ \
    prefix##_hash_pair_list* bucket_chain; \
    if (hash.size == 0) \
        return 0; \
    bucket_chain = &hash.table[(hashfunc)(key, hash.size)]; \
    LIST_ITERATE(prefix##_hash_pair, *bucket_chain, iter, \
        prefix##_hash_pair* pair = prefix##_hash_pair_list_value(iter); \
        if ((equalfunc)(pair->key, key)) \
        { \
	    return 1; \
        } \
    ) \
    return 0; \
} \
 \
/* Gets pointer to value corresponding to given key, NULL if key not found. */ \
valuetype* prefix##_hash_get(const prefix##_hash hash, const keytype key) \
{ \
    prefix##_hash_pair_list* bucket_chain; \
    if (hash.size == 0) \
        return NULL; \
    bucket_chain = &hash.table[(hashfunc)(key, hash.size)]; \
    LIST_ITERATE(prefix##_hash_pair, *bucket_chain, iter, \
        prefix##_hash_pair* pair = prefix##_hash_pair_list_value(iter); \
        if ((equalfunc)(pair->key, key)) \
        { \
	    return &(pair->value); \
        } \
    ) \
    return NULL; \
} \
 \
/* Removes key/value pair with given key, if present, else does nothing. */ \
void prefix##_hash_remove(prefix##_hash* hash, const keytype key) \
{ \
    prefix##_hash_pair_list* bucket_chain; \
    if (hash->size == 0) \
        return; \
    bucket_chain = &hash->table[(hashfunc)(key, hash->size)]; \
    LIST_ITERATE(prefix##_hash_pair, *bucket_chain, iter, \
        prefix##_hash_pair* pair = prefix##_hash_pair_list_value(iter); \
        if ((equalfunc)(pair->key, key)) \
        { \
	    prefix##_hash_pair_list_remove(bucket_chain, &iter); \
	    return; \
        } \
    ) \
 \
    /* Shrink hash if we pass the low water mark */ \
    if(hash->size > hash->entries*3) \
    { \
	prefix##_hash_resize(hash, hash->entries); \
    } \
} \
 \
/* A private utility function used by iterator handlers. \
   If iter.current points to the end of a bucket list, moves it on. */ \
static void prefix##_hash_skip(prefix##_hash_iterator* iter) \
{ \
    while (prefix##_hash_pair_list_done(iter->current)) \
    { \
	iter->table_index++; \
	if (prefix##_hash_done(*iter)) \
	    break; \
	iter->current = prefix##_hash_pair_list_first( \
	                    iter->hash->table[iter->table_index] ); \
    } \
} \
 \
/* Gets an iterator positioned at the first element of the hash. */ \
prefix##_hash_iterator prefix##_hash_first(prefix##_hash* hash) \
{ \
    prefix##_hash_iterator new_iter; \
    new_iter.hash = hash; \
    new_iter.table_index = 0; \
    if (hash->table != NULL) \
        new_iter.current = prefix##_hash_pair_list_first(hash->table[0]); \
    prefix##_hash_skip(&new_iter); \
    return new_iter; \
} \
 \
/* Updates an iterator to point to the next element of the hash. */ \
void prefix##_hash_next(prefix##_hash_iterator* iter) \
{ \
    if (prefix##_hash_done(*iter)) \
	return; \
    prefix##_hash_pair_list_next(&iter->current); \
    prefix##_hash_skip(iter); \
} \
 \
/* Returns nonzero iff iterator points beyond last element of hash. */ \
int prefix##_hash_done(const prefix##_hash_iterator iter) \
{ \
    return iter.hash->table == NULL || \
           iter.table_index == iter.hash->size; \
} \
 \
/* Retrieves pointer to key at position of given iterator */ \
keytype* prefix##_hash_key(const prefix##_hash_iterator iter) \
{ \
    if (prefix##_hash_done(iter)) \
	return NULL; \
    else \
    { \
        prefix##_hash_pair* pair = prefix##_hash_pair_list_value(iter.current); \
	return &pair->key; \
    } \
} \
 \
/* Retrieves pointer to value at position of given iterator */ \
valuetype* prefix##_hash_value(const prefix##_hash_iterator iter) \
{ \
    if (prefix##_hash_done(iter)) \
	return NULL; \
    else \
    { \
        prefix##_hash_pair* pair = prefix##_hash_pair_list_value(iter.current); \
	return &pair->value; \
    } \
} \
 \
/* Removes key/value pair at position of given iterator, \
   moving the iterator to the next pair. */ \
void prefix##_hash_remove_iterator(prefix##_hash_iterator* iter) \
{ \
    prefix##_hash* hash = iter->hash; \
    if (prefix##_hash_done(*iter)) \
	return; \
    prefix##_hash_pair_list_remove(&hash->table[iter->table_index], &iter->current); \
    prefix##_hash_skip(iter); \
  \
    /* Shrink hash if we pass the low water mark */ \
    if(hash->size > hash->entries*3) \
    { \
	prefix##_hash_resize(hash, hash->entries); \
    } \
} \
 \
/* Returns nonzero iff hash is empty (contains no elements). */ \
int prefix##_hash_empty(const prefix##_hash hash) \
{ \
    return hash.entries == 0; \
} \
 \
/* END DEFINE */

#endif /* #ifndef _HASH_H_ */
