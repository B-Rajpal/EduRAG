from flask import Flask, request, jsonify
from flask_cors import CORS
import pymysql
import bcrypt

app = Flask(__name__)
CORS(app)

# MySQL Database Configuration
DB_HOST = "localhost"
DB_USER = "root"
DB_PASSWORD = "root123"  # Replace with your MySQL root password
DB_NAME = "user"

# Connect to the MySQL database
def get_db_connection():
    connection = pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        cursorclass=pymysql.cursors.DictCursor
    )
    return connection

# Initialize the MySQL database
def init_db():
    conn = get_db_connection()
    with conn.cursor() as cursor:
        # Create users table with school_name and country
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                school_name VARCHAR(255) NOT NULL,
                country VARCHAR(100) NOT NULL,
                role ENUM('teacher', 'student') NOT NULL DEFAULT 'student',  -- Fixed the role enum value
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
    conn.commit()
    conn.close()

init_db()

# Signup API
@app.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    first_name = data.get("firstName")
    last_name = data.get("lastName")
    school_name = data.get("schoolName")
    country = data.get("country")
    role = data.get("role", "student")  # Default role is "student"

    # Hash the password
    hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO users (email, password, first_name, last_name, school_name, country, role)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (email, hashed_password, first_name, last_name, school_name, country, role))
        conn.commit()
        conn.close()
        return jsonify({"message": "Signup successful"}), 201
    except pymysql.err.IntegrityError:
        return jsonify({"error": "Email already exists"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Login API
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
    conn.close()

    if user and bcrypt.checkpw(password.encode("utf-8"), user["password"].encode("utf-8")):
        return jsonify({
            "message": "Login successful",
            "role": user["role"],  # Return the role (teacher/student) for frontend routing
            "user": {
                "email": user["email"],
                "firstName": user["first_name"],
                "lastName": user["last_name"],
                "schoolName": user["school_name"],
                "country": user["country"]
            }
        }), 200
    else:
        return jsonify({"error": "Invalid email or password"}), 401

if __name__ == '__main__':
    app.run(debug=True, port=5001)