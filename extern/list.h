/* A "template" for a single linked list module without an extra level
   of indirection, implemented in a typesafe way.

   For latest version see: http://moonflare.com/code/ctl/list.php

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

#ifndef _LIST_H_
#define _LIST_H_

#include <stdlib.h> /* malloc, free */

/* Put this in a header file */
#define DECLARE_LIST(type, prefix) \
 \
/* This is a node in the linked list. Note that if type is a struct \
   and not a pointer, we get the same effect as if declaring the same \
   struct with the next pointer added. */ \
typedef struct _##prefix##_list_node \
{ \
    type data; \
    struct _##prefix##_list_node* next; \
} prefix##_list_node; \
 \
/* This keeps track of a particular list by its first and last \
   node, enabling quick adding to the beginning and end. */ \
typedef struct \
{ \
    prefix##_list_node* first; \
    prefix##_list_node* last; \
} prefix##_list; \
 \
/* This is an opaque structure to be used when iterating through \
   the list. It keeps track of prev for deletion while iterating. */ \
typedef struct \
{ \
    prefix##_list_node* current; \
    prefix##_list_node* prev; \
} prefix##_list_iterator; \
 \
/* Creates a new empty list. */ \
prefix##_list prefix##_list_new(); \
\
/* Adds a value to the front of the list. */ \
void prefix##_list_push_front(prefix##_list* list, const type data); \
/* Adds a value to the end of the list. */ \
void prefix##_list_push_back(prefix##_list* list, const type data); \
/* Adds a value after the position of the iterator. */ \
void prefix##_list_add_after(prefix##_list* list, const prefix##_list_iterator iter, const type data); \
/* Adds a value before the position of the iterator. */ \
void prefix##_list_add_before(prefix##_list* list, const prefix##_list_iterator iter, const type data); \
 \
/* Removes a value from the front of the list. */ \
void prefix##_list_pop_front(prefix##_list* list); \
/* Removes the value at the position of the iterator, and updates \
   the iterator to the next element after the deleted one. */ \
void prefix##_list_remove(prefix##_list* list, prefix##_list_iterator* iter); \
/* Removes all elements of list, call this when done with it. */ \
void prefix##_list_clear(prefix##_list* list); \
 \
/* See the LIST_ITERATE macro to do typical iteration */ \
/* Gets a pointer to the data at the beginning of the list. */ \
type* prefix##_list_first_data(const prefix##_list list); \
/* Gets an iterator positioned at the first element of the list. */ \
prefix##_list_iterator prefix##_list_first(const prefix##_list list); \
/* Updates an iterator to point to the next element of the list. */ \
void prefix##_list_next(prefix##_list_iterator* iter); \
/* Returns nonzero iff iterator points beyond last element of list. */ \
int prefix##_list_done(const prefix##_list_iterator iter); \
 \
/* Retrieves pointer to value at position of given iterator */ \
type* prefix##_list_value(const prefix##_list_iterator iter); \
\
/* Returns nonzero iff list is empty (contains no elements). */ \
int prefix##_list_empty(const prefix##_list list); \
\
/* END DECLARE */

#define LIST_ITERATE(prefix, list, iter, body) \
{ \
   prefix##_list_iterator iter = prefix##_list_first(list); \
   for( ; !prefix##_list_done(iter); prefix##_list_next(&iter)) \
   { \
       body; \
   } \
}

/* Put this in a source file */
#define DEFINE_LIST(type, prefix) \
/* Creates a new empty list. */ \
prefix##_list prefix##_list_new() \
{ \
    prefix##_list new_list; \
    new_list.first = new_list.last = NULL; \
    return new_list; \
} \
\
/* Adds a value to the front of the list. */ \
void prefix##_list_push_front(prefix##_list* list, const type data) \
{ \
    prefix##_list_node* new_node = \
        (prefix##_list_node*)malloc(sizeof(prefix##_list_node)); \
    new_node->data = data; \
    new_node->next = list->first; \
    list->first = new_node; \
    if (list->last == NULL) \
        list->last = new_node; \
} \
 \
/* Adds a value to the end of the list. */ \
void prefix##_list_push_back(prefix##_list* list, const type data) \
{ \
    prefix##_list_node* new_node = \
        (prefix##_list_node*)malloc(sizeof(prefix##_list_node)); \
    new_node->data = data; \
    new_node->next = NULL; \
    if (list->last == NULL) \
        list->first = new_node; \
    else \
	list->last->next = new_node; \
    list->last = new_node; \
} \
 \
/* Adds a value after the position of the iterator. */ \
void prefix##_list_add_after(prefix##_list* list, const prefix##_list_iterator iter, const type data) \
{ \
    prefix##_list_node* new_node = \
        (prefix##_list_node*)malloc(sizeof(prefix##_list_node)); \
    new_node->data = data; \
    new_node->next = iter.current->next; \
    iter.current->next = new_node; \
    if (iter.current == list->last) \
	list->last = new_node; \
} \
 \
/* Adds a value before the position of the iterator. */ \
void prefix##_list_add_before(prefix##_list* list, const prefix##_list_iterator iter, const type data) \
{ \
    prefix##_list_node* new_node = \
        (prefix##_list_node*)malloc(sizeof(prefix##_list_node)); \
    new_node->data = data; \
    new_node->next = iter.current; \
    if (iter.prev == NULL) \
	list->first = new_node; \
    else \
	iter.prev->next = new_node; \
 \
    if (iter.current == NULL) \
	list->last = new_node; \
} \
 \
/* Removes a value from the front of the list. */ \
void prefix##_list_pop_front(prefix##_list* list) \
{ \
    prefix##_list_node* first_node = list->first; \
    list->first = first_node->next; \
    free(first_node); \
} \
 \
/* Removes the value at the position of the iterator, and updates \
   the iterator to the next element after the deleted one. */ \
void prefix##_list_remove(prefix##_list* list, prefix##_list_iterator* iter) \
{ \
    prefix##_list_node* next; \
    if (iter->current == NULL) \
	return; \
 \
    next = iter->current->next; \
    free(iter->current); \
    iter->current = next; \
    if (iter->prev != NULL) \
	iter->prev->next = next; \
    else \
	list->first = next; \
 \
    if (next == NULL) \
	list->last = iter->prev; \
} \
 \
/* Removes all elements of list, call this when done with it. */ \
void prefix##_list_clear(prefix##_list* list) \
{ \
    prefix##_list_node* node = list->first; \
    prefix##_list_node* next_node; \
    for( ; node != NULL; node = next_node) \
    { \
	next_node = node->next; \
	free(node); \
    } \
 \
    list->first = list->last = NULL; \
} \
 \
/* Gets a pointer to the data at the beginning of the list. */ \
type* prefix##_list_first_data(const prefix##_list list) \
{ \
    if (list.first == NULL) \
	return NULL; \
    else \
	return &(list.first->data); \
} \
/* Gets an iterator positioned at the first element of the list. */ \
prefix##_list_iterator prefix##_list_first(const prefix##_list list) \
{ \
    prefix##_list_iterator iter; \
    iter.current = list.first; \
    iter.prev    = NULL; \
    return iter; \
} \
 \
/* Updates an iterator to point to the next element of the list. */ \
void prefix##_list_next(prefix##_list_iterator* iter) \
{ \
    if (iter->current == NULL) \
	return; \
 \
    iter->prev    = iter->current; \
    iter->current = iter->current->next; \
} \
 \
/* Returns nonzero iff iterator points beyond last element of list. */ \
int prefix##_list_done(const prefix##_list_iterator iter) \
{ \
    return iter.current == NULL; \
} \
 \
/* Retrieves pointer to value at position of given iterator */ \
type* prefix##_list_value(const prefix##_list_iterator iter) \
{ \
    return &(iter.current->data); \
} \
 \
/* Returns nonzero iff list is empty (contains no elements). */ \
int prefix##_list_empty(const prefix##_list list) \
{ \
    return list.first == NULL; \
} \
 \
/* END DEFINE */

#endif /* #ifndef _LIST_H_ */
