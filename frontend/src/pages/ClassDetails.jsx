import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/classdetails.css";
import Chatbot from "../components/Chatbot";
import FileUpload from "../components/Fileupload";

// import AnimatedCursor from "react-animated-cursor"
import { GoArrowLeft } from "react-icons/go";
const ClassDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const classes = [
    { id: "1", title: "Mathematics", teacher: "Mr. Smith", description: "Learn algebra, geometry, and calculus." },
    { id: "2", title: "Science", teacher: "Mrs. Johnson", description: "Explore physics, chemistry, and biology." },
    { id: "3", title: "History", teacher: "Mr. Lee", description: "Dive into world history and civilizations." },
    { id: "4", title: "English", teacher: "Ms. Brown", description: "Improve your literature and language skills." },
  ];

  const selectedClass = classes.find((classItem) => classItem.id === id);

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
    //   <AnimatedCursor />
    <div>
    <div className="class-details-container">
    <button className="back-button" onClick={() => navigate(-1)}>
    <GoArrowLeft />
    </button>
    <h1 className="class-title">{selectedClass.title}</h1>
    <p className="class-teacher">Taught by: {selectedClass.teacher}</p>
    <p className="class-description">{selectedClass.description}</p>
    <FileUpload/>
    </div>
    <Chatbot/>
    </div>
  );
};

export default ClassDetails;
