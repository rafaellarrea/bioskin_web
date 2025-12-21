import sqlite3
import os

# Use raw string for Windows path
db_path = r"c:\Users\Gamer\Documents\BIO SKIN\BIOTECH\software\centroEstetico\database\centro.db"

print(f"Attempting to connect to database at: {db_path}")

if not os.path.exists(db_path):
    print(f"Error: Database file not found at {db_path}")
    exit(1)

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. List all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    table_names = [t[0] for t in tables]
    
    print(f"Found {len(table_names)} tables: {', '.join(table_names)}\n")
    print("="*50 + "\n")

    # 2. Inspect each table
    for table_name in table_names:
        # Filter for potentially relevant tables based on keywords if there are many, 
        # but for now let's look at all of them to be sure we don't miss anything.
        # Keywords: clinical, record, option, list, type, cat, disease, skin, treatment, diagnosis, exam
        
        print(f"--- Table: {table_name} ---")
        
        # Get Schema
        cursor.execute(f"SELECT sql FROM sqlite_master WHERE type='table' AND name='{table_name}';")
        schema_res = cursor.fetchone()
        if schema_res:
            print("Schema:")
            print(schema_res[0])
        
        # Get first 5 rows
        try:
            cursor.execute(f"SELECT * FROM \"{table_name}\" LIMIT 5;")
            rows = cursor.fetchall()
            
            # Get column names
            if cursor.description:
                column_names = [description[0] for description in cursor.description]
                print(f"Columns: {column_names}")
            
            print(f"Data (First {len(rows)} rows):")
            for row in rows:
                print(row)
        except Exception as e:
            print(f"Could not read data from {table_name}: {e}")
            
        print("\n" + "-"*30 + "\n")

    conn.close()

except Exception as e:
    print(f"An error occurred: {e}")
