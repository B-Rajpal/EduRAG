// import React from "react";
// import "../styles/display.css";
// import { useNavigate } from "react-router-dom";
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faUser } from '@fortawesome/free-solid-svg-icons';

// const Home = () => {
//   const navigate = useNavigate();

//   const classes = [
//     { id: "1", title: "Mathematics", teacher: "Mr. Smith", description: "Learn algebra, geometry, and calculus." },
//     { id: "2", title: "Science", teacher: "Mrs. Johnson", description: "Explore physics, chemistry, and biology." },
//     { id: "3", title: "History", teacher: "Mr. Lee", description: "Dive into world history and civilizations." },
//     { id: "4", title: "English", teacher: "Ms. Brown", description: "Improve your literature and language skills." },
//   ];

//   const handleClassClick = (id) => {
//     navigate(`/class/${id}`);
//   };
//   const handleNavigation = () => {
//     navigate("/profile"); // Change "/profile" to your desired route
//   };
//   const handleNavigation1 = () => {
//     navigate("/form"); // Change "/profile" to your desired route
//   };

//   return (
//     <div className="classroom-container">
//     <header className="classroom-header">
//     <h1>Google Classroom...</h1>
//     <div>
//       <button className="create-class-button"    onClick={handleNavigation1} >
      
//       +Create Class</button>
//       &nbsp;&nbsp;
//       <FontAwesomeIcon icon={faUser}
//       onClick={handleNavigation}  />
//       </div>
//       </header>

//       <div className="class-grid">
//         {classes.map((classItem) => (
//           <div
//             key={classItem.id}
//             className="class-card"
//             onClick={() => handleClassClick(classItem.id)}
//             style={{ cursor: "pointer" }}
//           >
//             <h2 className="class-title">{classItem.title}</h2>
//             <p className="class-teacher">Taught by: {classItem.teacher}</p>
//             <p className="class-description">{classItem.description}</p>
//             <button className="view-class-button">View Class</button>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default Home;
import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/display.css";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

export const Home = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch classes from the backend
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axios.get("http://localhost:5001/classes");
        setClasses(response.data.classes); 
      } catch (error) {
        setErrorMessage("Failed to fetch classes. Please try again.");
      }
    };

    fetchClasses();
  }, []);

  const handleClassClick = (id) => {
    navigate(`/class/${id}`);
  };

  const handleNavigation = () => {
    navigate("/profile");
  };

  const handleNavigation1 = () => {
    navigate("/form");
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <h1 className="main-title">Google Classroom</h1>
        <div className="header-actions">
          <button className="create-class-button" onClick={handleNavigation1}>
            + Create Class
          </button>
          <FontAwesomeIcon icon={faUser} onClick={handleNavigation} className="profile-icon" />
        </div>
      </header>

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <div className="class-grid">
        {classes.length > 0 ? (
          classes.map((classItem) => (
            <div
              key={classItem.id}
              className="class-card"
              onClick={() => handleClassClick(classItem.id)}
            ><img src="https://assets.entrepreneur.com/content/3x2/2000/20191219170611-GettyImages-1152794789.jpeg" alt="Book" />
              <div className="class-card-header">
                <h2 className="class-title">{classItem.title}</h2>
                <p className="class-teacher">Taught by: {classItem.teacher}</p>
              </div>
              <p className="class-description">{classItem.description}</p>
              <button className="view-class-button">View Class</button>
            </div>
          ))
        ) : (
          <p>No classes available.</p>
        )}
      </div>
    </div>
  );
};
