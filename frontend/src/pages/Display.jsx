import React from "react";
import "../styles/display.css";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

const Display = () => {
  const navigate = useNavigate();

  const classes = [
    { id: "1", title: "Mathematics", teacher: "Mr. Smith", description: "Learn algebra, geometry, and calculus." },
    { id: "2", title: "Science", teacher: "Mrs. Johnson", description: "Explore physics, chemistry, and biology." },
    { id: "3", title: "History", teacher: "Mr. Lee", description: "Dive into world history and civilizations." },
    { id: "4", title: "English", teacher: "Ms. Brown", description: "Improve your literature and language skills." },
  ];

  const handleClassClick = (id) => {
    navigate(`/class/${id}`);
  };

  return (
      //   <button className="create-class-button">
        
      //   +Create Class</button>
      <div className="classroom-container">
      <header className="classroom-header">
      <h1>Google Classroom...</h1>

      <FontAwesomeIcon icon={faUser} />
      </header>

      <div className="class-grid">
        {classes.map((classItem) => (
          <div
            key={classItem.id}
            className="class-card"
            onClick={() => handleClassClick(classItem.id)}
            style={{ cursor: "pointer" }}
          >
            <h2 className="class-title">{classItem.title}</h2>
            <p className="class-teacher">Taught by: {classItem.teacher}</p>
            <p className="class-description">{classItem.description}</p>
            <button className="view-class-button">View Class</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Display;
