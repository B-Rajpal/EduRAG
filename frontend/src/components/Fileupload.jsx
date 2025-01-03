import React, { useState } from 'react';
import axios from 'axios';

const FileUpload = ({ subject, onFileUpload }) => {
  const [files, setFiles] = useState([]);

 
  const handleFileChange = (event) => {
    setFiles(event.target.files);
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
      await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert(`Files uploaded successfully for ${subject}.`);
      onFileUpload();
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
