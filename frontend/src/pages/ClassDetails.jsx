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
  const [selectedClass, setSelectedClass] = useState(null);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchClassDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/classes/${id}`);
        setSelectedClass(response.data);
      } catch (err) {
        setError("Class not found.");
      }
    };
    fetchClassDetails();
  }, [id]);

  const fetchFiles = () => {
    if (selectedClass) {
      setIsLoading(true);
      axios
        .get(`http://localhost:5000/preview?subject=${selectedClass.class.title}`)
        .then((response) => {
          setFiles(response.data.files || []);
          setError(null);
        })
        .catch((err) => setError(err.message))
        .finally(() => setIsLoading(false));
    }
  };

  const handleDeleteClass = async () => {
    try {
      await axios.delete(`http://localhost:5001/classes/${id}`);
      alert("Class deleted successfully.");
      navigate("/"); // Redirect to the main page or any other page
    } catch (error) {
      console.error("Error deleting class:", error);
      alert("Failed to delete class.");
    }
  };

  const handleDeleteFile = async (fileName) => {
    try {
      await axios.delete(`http://localhost:5000/delete`, {
        data: { fileName, subject: selectedClass.class.title },
      });
      alert(`${fileName} deleted successfully.`);
      fetchFiles();
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Failed to delete file.");
    }
  };

  useEffect(() => {
    if (files) {
      fetchFiles();
    }
  }, [selectedClass]);

  if (error) {
    return (
      <div className="class-details-container">
        <h1>{error}</h1>
        <button className="back-button" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
    );
  }

  if (!selectedClass) {
    return <p>Loading...</p>;
  }

  return (
    <div className="class-details-container">
      <button className="back-button" onClick={() => navigate(-1)}>
        <GoArrowLeft />
      </button>
  
      <button className="delete-class-button" onClick={handleDeleteClass}>
        Delete Class
      </button>
  
      <div className="class-info">
        <h1 className="class-title">{selectedClass.class.title}</h1>
        <p className="class-teacher">Taught by: {selectedClass.class.teacher}</p>
        <p className="class-description">{selectedClass.class.description}</p>

      <FileUpload subject={selectedClass.class.title} onFileUpload={fetchFiles} />
  
      <div className="file-preview">
        <h2>Preview Files</h2>
        {error && <p className="error">{error}</p>}
        {isLoading ? (
          <p>Loading files...</p>
        ) : files.length > 0 ? (
          <ul>
            {files.map((file, index) => (
              <li key={index}>
                {file}
                <button onClick={() => handleDeleteFile(file)} className="delete-button">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No files available for this subject.</p>
        )}
      </div>
 
      <Chatbot subject={selectedClass.class.title} />
    </div>
    </div>
  );
  };

export default ClassDetails;
