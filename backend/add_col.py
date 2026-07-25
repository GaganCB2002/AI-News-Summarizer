import sqlite3
conn = sqlite3.connect('ai_news.db')
cursor = conn.cursor()
try:
    cursor.execute("ALTER TABLE users ADD COLUMN profile_image_url VARCHAR(255)")
    conn.commit()
    print("Column added successfully.")
except sqlite3.OperationalError as e:
    print(f"Error: {e}")
finally:
    conn.close()
