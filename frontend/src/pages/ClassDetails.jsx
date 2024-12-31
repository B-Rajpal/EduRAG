import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/classdetails.css";
import Chatbot from "../components/Chatbot";
import { GoArrowLeft } from "react-icons/go";
import FileUpload from "../components/Fileupload";
import axios from "axios";

const ClassDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);

  const classes = [
    { id: "1", title: "Mathematics", teacher: "Mr. Smith", description: "Learn algebra, geometry, and calculus." },
    { id: "2", title: "Science", teacher: "Mrs. Johnson", description: "Explore physics, chemistry, and biology." },
    { id: "3", title: "History", teacher: "Mr. Lee", description: "Dive into world history and civilizations." },
    { id: "4", title: "English", teacher: "Ms. Brown", description: "Improve your literature and language skills." },
  ];

  const selectedClass = classes.find((classItem) => classItem.id === id);

  useEffect(() => {
    if (selectedClass) {
      // Fetch files for the selected subject
      axios
        .get(`http://localhost:5000/preview?subject=${selectedClass.title}`)
        .then((response) => setFiles(response.data.files || []))
        .catch((err) => setError(err.message));
    }
  }, [selectedClass]);

  if (!selectedClass) {
    return (
      <div className="class-details-container">
        <h1>Class not found</h1>
        <button className="back-button" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="class-details-container">
        <button className="back-button" onClick={() => navigate(-1)}>
          <GoArrowLeft />
        </button>
        <h1 className="class-title">{selectedClass.title}</h1>
        <p className="class-teacher">Taught by: {selectedClass.teacher}</p>
        <p className="class-description">{selectedClass.description}</p>
        {/* Pass title to FileUpload */}
        <FileUpload subject={selectedClass.title} />

        <div className="file-preview">
          <h2>Preview Files</h2>
          {error && <p className="error">{error}</p>}
          {files.length > 0 ? (
            <ul>
              {files.map((file, index) => (
                <li key={index}>{file}</li>
              ))}
            </ul>
          ) : (
            <p>No files available for this subject.</p>
          )}
        </div>
      </div>
      <Chatbot subject={selectedClass.title}/>
    </div>
  );
};

export default ClassDetails;
