import React from "react";
import "../styles/dashboard.css"; // Make sure to create and link this CSS file

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="account-section">
          <img
            src="https://via.placeholder.com/50" // Replace with a real profile image
            alt="Account Icon"
            className="account-icon"
          />
          <h3>John Doe</h3>
        </div>
        <nav className="nav-menu">
          <ul>
            <li>Mathematics</li>
            <li>Science</li>
            <li>History</li>
            <li>Language Arts</li>
            <li>Computer Science</li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Dashboard;
