if [ -e database.db ]; then
  echo "WARNING: The database.db file already exists. Press any key to wipe it"
  read
  rm -f database.db
fi

# Create tables with the latest schema
sqlite3 database.db "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL, fullname TEXT NOT NULL);"
sqlite3 database.db "CREATE TABLE IF NOT EXISTS rooms (id INTEGER PRIMARY KEY, name TEXT NOT NULL);"

# Insert some sample data
sqlite3 database.db "INSERT INTO users (username, fullname) VALUES ('test', 'Test User');"
sqlite3 database.db "INSERT INTO rooms (name) VALUES ('Awesome Test Room');"