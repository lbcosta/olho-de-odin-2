# 4. Single Database File with Multi-Profile Support

We decided to use a single SQLite database file (`olhodeodin.db`) to store all application data. The database schema supports multiple profiles through a `profiles` table. All user-specific data (such as the watchlist, custom item properties, and configurations) contains a `profile_id` foreign key. Users can switch profiles in the user interface. Exporting a profile serializes only the database records linked to that specific `profile_id` into a JSON file, and importing inserts or merges that data back into the database.
