if [ -e database.db ]; then
  echo "WARNING: The database.db file already exists. Press any key to wipe it"
  read
  rm -f database.db
fi

sqlite3 database.db "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, fullname TEXT NOT NULL);"
sqlite3 database.db "CREATE TABLE IF NOT EXISTS rooms (id INTEGER PRIMARY KEY, name TEXT NOT NULL);"