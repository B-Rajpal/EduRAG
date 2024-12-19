from flask import Flask, request, jsonify
import os
from flask_cors import CORS
app = Flask(__name__)
CORS(app)

# Define the directory to save uploaded files
UPLOAD_FOLDER = 'uploads/'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/upload', methods=['POST'])
def upload_file():
    # Check if the file is part of the request
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # Save the file to the uploads directory
    file_path = os.path.join(UPLOAD_FOLDER, "hello "+file.filename)
    print(file_path)
    file.save(file_path)

    # Return the file path
    return jsonify({"message": "File uploaded successfully", "filePath": file_path}), 200


if __name__ == '__main__':
    app.run(debug=True, port=5000)
