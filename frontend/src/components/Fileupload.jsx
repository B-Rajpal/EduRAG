import React, { useState } from 'react';
import axios from 'axios';

const FileUpload = ({ subject, onFileUpload }) => {
  const [files, setFiles] = useState([]);

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);

    // Filter to only allow PDFs
    const invalidFiles = selectedFiles.filter(file => !file.name.endsWith('.pdf'));

    if (invalidFiles.length > 0) {
      alert('Only PDF files are allowed.');
      return; // Do not proceed if there are invalid files
    }

    setFiles(selectedFiles); // Set files if they are all PDFs
  };

  const handleFileUpload = async () => {
    if (!files.length) {
      alert('Please select at least one file to upload.');
      return;
    }

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });
    formData.append('subject', subject);

    try {
      // Upload the files
      await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert(`Files uploaded successfully for ${subject}.`);

      // Call the chunk endpoint after files are uploaded
      const selectedFiles = Array.from(files)
        .map((file) => `E:\\Finalyear_project\\EduRAG\\backend\\uploads\\${subject}\\${file.name}`);

      const chunkResponse = await axios.post(
        "http://localhost:5000/chunk",
        {
          filePaths: selectedFiles,
          subject: subject,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Chunk response:", chunkResponse.data);

      // After successful chunk request, invoke the callback to re-fetch files
      onFileUpload();

      // Clear files after upload and chunk operation
      setFiles([]);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Error uploading files.');
    }
  };

  return (
    <div>
      <h3>Upload Files for {subject}</h3>
      <input type="file" multiple onChange={handleFileChange} />
      <button onClick={handleFileUpload}>Upload</button>
    </div>
  );
};

export default FileUpload;
