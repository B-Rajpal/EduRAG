import React, { useState } from "react";
import { useNavigate } from "react-router-dom";  // Use useNavigate instead of useHistory
import axios from "axios";  // Import axios
import "../styles/login.css";  // Import the CSS file

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();  // Use the navigate function

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:5001/login", {
        email,
        password,
      });

      const { role, user } = response.data;

      // Store user info in localStorage for persistence
      localStorage.setItem("email", user.email);
      localStorage.setItem("role", role);

      // Redirect based on role using navigate
      if (role === "admin") {
        navigate("/admin");  // Navigate to the Admin page
      } else {
        navigate("/user");   // Navigate to the User page
      }
    } catch (err) {
      setError("Invalid credentials, please try again.");
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
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input-field"
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" className="submit-button">
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
