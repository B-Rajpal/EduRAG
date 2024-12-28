import React, { useState } from "react";
import axios from "axios"; // Import axios
import "../styles/signup.css"; // Import CSS for styling

const Signup = () => {
  const [formData, setFormData] = useState({
    email: "",  // Ensure initial value is an empty string
    password: "",  // Ensure initial value is an empty string
    firstName: "",
    lastName: "",
    school: "",
    country: "",
    role: "",
    termsAccepted: false  // Add state for terms acceptance
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password, firstName, lastName, school, country, role, termsAccepted } = formData;

    // Form validation
    if (!email || !password || !firstName || !lastName || !school || !country || !role) {
      setError("All fields are required.");
      return;
    }

    if (!termsAccepted) {
      setError("You must accept the terms and conditions.");
      return;
    }

    setError(""); // Clear any previous error
    setLoading(true); // Show loading spinner or disable button during the request

    try {
      const response = await axios.post("http://localhost:5001/signup", {
        email,
        password,
        firstName,
        lastName,
        schoolName: school,
        country,
        role,
      });

      // Handle successful signup
      if (response.status === 201) {
        alert("Signup successful!");
        // You can redirect or clear the form if needed
      }
    } catch (err) {
      // Handle error
      if (err.response && err.response.data) {
        setError(err.response.data.error || "Signup failed. Please try again.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false); // Hide loading spinner or re-enable button
    }
  };

  return (
    <div className="signup-container">
      <h1>Signup</h1>
      <form onSubmit={handleSubmit} className="signup-form">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email || ""}  // Ensure value is controlled
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password || ""}  // Ensure value is controlled
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="firstName">First Name</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName || ""}  // Ensure value is controlled
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="lastName">Last Name</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName || ""}  // Ensure value is controlled
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="school">School</label>
          <input
            type="text"
            id="school"
            name="school"
            value={formData.school || ""}  // Ensure value is controlled
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="country">Country</label>
          <select
            id="country"
            name="country"
            value={formData.country || ""}  // Ensure value is controlled
            onChange={handleChange}
            required
          >
            <option value="">Select Country</option>
            <option value="USA">USA</option>
            <option value="Canada">Canada</option>
            <option value="UK">UK</option>
            <option value="India">India</option>
            <option value="Australia">Australia</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="role">Role</label>
          <select
            id="role"
            name="role"
            value={formData.role || ""}  // Ensure value is controlled
            onChange={handleChange}
            required
          >
            <option value="">Select Role</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>
        </div>

        {/* Terms and Conditions Checkbox */}
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={handleChange}
              required
            />
            I accept the <a href="/terms">Terms and Conditions</a>
          </label>
        </div>

        {error && <div className="error-message">{error}</div>} {/* Display error message */}
        <button type="submit" className="signup-button" disabled={loading}>
          {loading ? "Signing Up..." : "Signup"}
        </button>
      </form>
    </div>
  );
};

export default Signup;
