import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import axios from "axios"; 
import "../styles/login.css"; 

const Login = () => {
  const [email, setEmail] = useState(""); // State for email
  const [password, setPassword] = useState(""); // State for password
  const [error, setError] = useState(""); // State for error messages
  const navigate = useNavigate(); // React Router's useNavigate hook

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    try {
      const response = await axios.post("http://localhost:5001/login", {
        email,
        password,
      });

      const { userId } = response.data; // Extract userId from response
      localStorage.setItem("userId", userId); // Store userId in localStorage
      navigate("/"); // Redirect to the profile page
    } catch (err) {
      // Handle errors
      if (err.response && err.response.data) {
        setError(err.response.data.error); // Show error message from backend
      } else {
        setError("An unexpected error occurred. Please try again."); // General error message
      }
    }
  };

  return (
    <div className="login-container">
      <h1>Login</h1>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required
            className="input-field"
            placeholder=" "
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password} // Bind state to input
            onChange={(e) => setPassword(e.target.value)} // Update state on change
            required
            className="input-field"
            placeholder=" "
          />
        </div>
        {error && <div className="error-message">{error}</div>} {/* Display error message */}
        <button type="submit" className="submit-button">
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
