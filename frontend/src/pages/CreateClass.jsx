import React, { useState } from "react";
import axios from "axios";
import "../styles/createclass.css";

const CreateClass = () => {
  const [formData, setFormData] = useState({
    title: "",
    teacher: "",
    description: "",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Example of getting the user ID for 'createdBy' (you might use a real authentication system)
  const createdBy = 1; // This would be dynamically set based on the logged-in user

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Include createdBy in the request payload
    const dataToSend = { ...formData, createdBy };

    axios
      .post("http://localhost:5001/classes", dataToSend)
      .then((response) => {
        setSuccessMessage("Class created successfully!");
        setErrorMessage("");
        setFormData({ title: "", teacher: "", description: "" }); // Reset the form
      })
      .catch((error) => {
        const errorMsg = error.response?.data?.error || "Failed to create the class. Please try again.";
        setErrorMessage(errorMsg);
        setSuccessMessage("");
      });
  };

  return (
    <div className="create-class-container">
      <h1>Create New Class</h1>
      <form onSubmit={handleSubmit} className="create-class-form">
        <div className="form-group">
          <label htmlFor="title">Class Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter class title"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="teacher">Teacher's Name</label>
          <input
            type="text"
            id="teacher"
            name="teacher"
            value={formData.teacher}
            onChange={handleChange}
            placeholder="Enter teacher's name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Class Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter class description"
            rows="4"
            required
          ></textarea>
        </div>

        <button type="submit" className="submit-button">
          Create Class
        </button>
      </form>

      {successMessage && <p className="success-message">{successMessage}</p>}
      {errorMessage && <p className="error-message">{errorMessage}</p>}
    </div>
  );
};

export default CreateClass;
