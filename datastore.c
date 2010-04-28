#include <stdio.h>
#include <stdlib.h>
#include <sqlite3.h>
#include <sys/stat.h>

sqlite3 *db = NULL;

void mds_shutdown() {
  if (db) 
    sqlite3_close(db);
}

void mds_init() {
  fprintf(stderr, "Initializing database...\n");

  struct stat results;
  if (stat("database.db", &results) != 0) {
    fprintf(stderr, "Database doesn't exist. Please run \"./createdb.sh\".\n");
    exit(1);
  }
  
  if (sqlite3_open("database.db", &db)) {
    fprintf(stderr, "Can't open database: %s\n", sqlite3_errmsg(db));
    mds_shutdown();
    exit(1);
  }

  // Count total users
  sqlite3_stmt *users_query;
  if (sqlite3_prepare_v2(db, "SELECT COUNT(*) FROM users;", -1, &users_query, NULL) == SQLITE_OK) {
    if (sqlite3_step(users_query) == SQLITE_ROW)
      fprintf(stderr, "  Total users: %d\n", sqlite3_column_int(users_query, 0));
  }
  sqlite3_finalize(users_query);
  
  // Count total rooms
  sqlite3_stmt *rooms_query;
  if (sqlite3_prepare_v2(db, "SELECT COUNT(*) FROM rooms;", -1, &rooms_query, NULL) == SQLITE_OK) {
    if (sqlite3_step(rooms_query) == SQLITE_ROW)
      fprintf(stderr, "  Total rooms: %d\n", sqlite3_column_int(rooms_query, 0));
  }
  sqlite3_finalize(rooms_query);
}