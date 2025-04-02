import React, { useState, useRef } from 'react';
import axios from 'axios';

const FileUpload = ({ subject, onFileUpload }) => {
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null); // Ref to reset input field

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    const invalidFiles = selectedFiles.filter(file => !file.name.endsWith('.pdf'));

    if (invalidFiles.length > 0) {
      alert('Only PDF files are allowed.');
      return;
    }

    setFiles(selectedFiles);
  };

  const handleFileUpload = async () => {
    if (!files.length) {
      alert('Please select at least one file to upload.');
      return;
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('subject', subject);

    try {
      await axios.post('http://localhost:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert(`Files uploaded successfully for ${subject}.`);
      await onFileUpload(); // Refresh file list
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Error uploading files.');
    }
  };

  return (
    <div>
      <h3>Upload Files for {subject}</h3>
      <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} />
      <button onClick={handleFileUpload}>Upload</button>
    </div>
  );
};

export default FileUpload;
