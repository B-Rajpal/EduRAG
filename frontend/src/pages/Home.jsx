import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/display.css";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSearch } from '@fortawesome/free-solid-svg-icons';
import logo from "../assests/logo.png";
export const Home = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredClasses = classes.filter((classItem) =>
    classItem.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="home-container">
      <header className="home-header">
      <img src={logo} alt="Logo" className="logo" />
        <h1 className="main-title">EDURAG</h1>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search classes..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
          <button className="create-class-button" onClick={handleNavigation1}>
            + Create Class
          </button>
          <FontAwesomeIcon icon={faUser} onClick={handleNavigation} className="profile-icon" />
        </div>
      </header>

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <div className="class-grid">
        {filteredClasses.length > 0 ? (
          filteredClasses.map((classItem) => (
            <div
              key={classItem.id}
              className="class-card"
              onClick={() => handleClassClick(classItem.id)}
            >
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
