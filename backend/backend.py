from flask import Flask, request, jsonify
from flask_cors import CORS
import pymysql
import bcrypt
import json
app = Flask(__name__)
CORS(app)

# MySQL Database Configuration
DB_HOST = "localhost"
DB_USER = "root"
DB_PASSWORD = "Pr@040903"  # Replace with your MySQL root password
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
        # Create users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                school_name VARCHAR(255) NOT NULL,
                country VARCHAR(100) NOT NULL,
                role ENUM('teacher', 'student') NOT NULL DEFAULT 'student',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create classes table
        cursor.execute("""
           CREATE TABLE IF NOT EXISTS classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    teacher VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    total_hours INT NOT NULL,
    number_of_assessments INT NOT NULL,
    assessments JSON NOT NULL,
    created_by INT NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
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
            "userId": user["id"],  # Return user ID
            "email": user["email"],  # Return email
            "role": user["role"],  # Return role for frontend routing
        }), 200
    else:
        return jsonify({"error": "Invalid email or password"}), 401

# Create Class API
@app.route("/classes", methods=["POST"])
def create_class():
    data = request.get_json()
    
    # Extract fields from the request
    title = data.get("title")
    teacher = data.get("teacher")
    description = data.get("description")
    total_hours = data.get("totalHours")
    number_of_assessments = data.get("numberOfAssessments")
    assessments = data.get("assessments")  # This should be a list of assessment titles
    created_by = data.get("createdBy")  # Assume frontend sends the user ID of the creator

    # Validate required fields
    if not all([title, teacher, description, total_hours, number_of_assessments, assessments, created_by]):
        return jsonify({"error": "All fields are required!"}), 400

    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # Insert data into the classes table
            cursor.execute("""
                INSERT INTO classes (title, teacher, description, total_hours, number_of_assessments, assessments, created_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (title, teacher, description, total_hours, number_of_assessments, json.dumps(assessments), created_by))
            conn.commit()
            new_class_id = cursor.lastrowid

        return jsonify({"message": "Class created successfully!", "classId": new_class_id}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()
@app.route('/assessments', methods=['GET'])
def get_assessments():
    """Endpoint to retrieve assessments of all classes grouped by class name."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # Fetch class data including assessments (stored as JSON)
            cursor.execute("SELECT title, assessments FROM classes")
            class_data = cursor.fetchall()

        if class_data:
            # Process assessments from JSON to list and group by class name
            for class_info in class_data:
                class_info['assessments'] = json.loads(class_info['assessments'])

            return jsonify({"classes": class_data}), 200
        else:
            return jsonify({"error": "No classes found"}), 404
    except Exception as e:
        print(f"Error fetching assessments: {e}")
        return jsonify({"error": "Internal server error"}), 500
    finally:
        conn.close()

@app.route('/total-hours', methods=['GET'])
def get_total_hours():
    """Endpoint to retrieve total hours of all classes grouped by class name."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # Fetch class data including total_hours
            cursor.execute("SELECT title, total_hours FROM classes")
            class_data = cursor.fetchall()

        if class_data:
            return jsonify({"classes": class_data}), 200
        else:
            return jsonify({"error": "No classes found"}), 404
    except Exception as e:
        print(f"Error fetching total hours: {e}")
        return jsonify({"error": "Internal server error"}), 500
    finally:
        conn.close()

# Get All Classes API
@app.route("/classes", methods=["GET"])
def get_classes():
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT *
                FROM classes
            """)
            classes = cursor.fetchall()

        return jsonify({"classes": classes}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()

# Profile API
@app.route("/profile", methods=["GET"])
def profile():
    user_id = request.headers.get("Authorization")  # Fetch user ID from header

    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT email, first_name, last_name, school_name, country, role 
                FROM users WHERE id = %s
            """, (user_id,))
            user = cursor.fetchone()
        conn.close()

        if user:
            return jsonify({"user": user}), 200
        else:
            return jsonify({"error": "User not found"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500
@app.route('/classes/<int:class_id>', methods=['GET'])
def get_class_by_id(class_id):
    """Endpoint to retrieve a class by its ID."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM classes WHERE id = %s", (class_id,))
            class_data = cursor.fetchone()
        conn.close()

        if class_data:
            return jsonify({"class": class_data}), 200
        else:
            return jsonify({"error": "Class not found"}), 404
    except Exception as e:
        print(f"Error fetching class by ID: {e}")  # Log the error
        return jsonify({"error": "Internal server error"}), 500

@app.route("/profile", methods=["PUT"])
def update_profile():
    user_id = request.headers.get("Authorization")  # Fetch user ID from the Authorization header

    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    first_name = data.get("first_name")
    last_name = data.get("last_name")
    school_name = data.get("school_name")
    country = data.get("country")
    email = data.get("email")

    # Validate required fields
    if not all([first_name, last_name, school_name, country, email]):
        return jsonify({"error": "All fields are required!"}), 400

    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # Update the user's profile details in the database
            cursor.execute("""
                UPDATE users
                SET first_name = %s, last_name = %s, school_name = %s, country = %s, email = %s
                WHERE id = %s
            """, (first_name, last_name, school_name, country, email, user_id))
            conn.commit()

            # Fetch the updated profile details
            cursor.execute("""
                SELECT email, first_name, last_name, school_name, country, role
                FROM users
                WHERE id = %s
            """, (user_id,))
            updated_user = cursor.fetchone()

        if updated_user:
            return jsonify({
                "message": "Profile updated successfully",
                "updatedUser": updated_user
            }), 200
        else:
            return jsonify({"error": "Failed to fetch updated profile"}), 500

    except Exception as e:
        print(f"Error updating profile: {e}")  # Log the error
        return jsonify({"error": "Internal server error"}), 500

    finally:
        conn.close()

@app.route('/classes/<int:class_id>', methods=['DELETE'])
def delete_class(class_id):
    """Endpoint to delete a class by its ID."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # Check if the class exists
            cursor.execute("SELECT * FROM classes WHERE id = %s", (class_id,))
            class_data = cursor.fetchone()

            if not class_data:
                return jsonify({"error": "Class not found"}), 404

            # Delete the class
            cursor.execute("DELETE FROM classes WHERE id = %s", (class_id,))
            conn.commit()

        return jsonify({"message": "Class deleted successfully"}), 200

    except Exception as e:
        print(f"Error deleting class: {e}")  # Log the error
        return jsonify({"error": "Internal server error"}), 500

    finally:
        conn.close()

if __name__ == '__main__':
    app.run(debug=True, port=5001)
