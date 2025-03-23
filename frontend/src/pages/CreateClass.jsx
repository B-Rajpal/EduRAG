import React, { useState } from "react";
import axios from "axios";
import "../styles/createclass.css";
import { useNavigate } from "react-router-dom";
import { GoArrowLeft } from "react-icons/go";

const CreateClass = () => {
  const [formData, setFormData] = useState({
    title: "",
    teacher: "",
    description: "",
    totalHours: "",
    numberOfAssessments: "",
    assessments: [],
  });
  const [newAssessment, setNewAssessment] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const createdBy = 1; // Replace with the logged-in user's ID
  const navigate = useNavigate();
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleAddAssessment = () => {
    if (newAssessment.trim() !== "") {
      setFormData((prevData) => ({
        ...prevData,
        assessments: [...prevData.assessments, newAssessment],
      }));
      setNewAssessment("");
    }
  };

  const handleRemoveAssessment = (index) => {
    setFormData((prevData) => ({
      ...prevData,
      assessments: prevData.assessments.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    axios
      .get("http://localhost:5000/makedir", {
        params: { subject: formData.title },
      })
      .then(() => {
        const dataToSend = { ...formData, createdBy };

        axios
          .post("http://localhost:5001/classes", dataToSend)
          .then(() => {
            setSuccessMessage("Class created successfully!");
            setErrorMessage("");
            setFormData({
              title: "",
              teacher: "",
              description: "",
              totalHours: "",
              numberOfAssessments: "",
              assessments: [],
            });
            navigate("/");
          })
          .catch((error) => {
            const errorMsg =
              error.response?.data?.error || "Failed to create the class. Please try again.";
            setErrorMessage(errorMsg);
            setSuccessMessage("");
          });
      })
      .catch((error) => {
        const errorMsg =
          error.response?.data?.error || "Failed to create the directory for the subject.";
        setErrorMessage(errorMsg);
        setSuccessMessage("");
      });
  };

  return (
    
    <div className="create-class-container">

<button className="back-button" onClick={() => navigate(-1)}>
        <GoArrowLeft />
      </button>
      
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

        <div className="form-group">
          <label htmlFor="totalHours">Total Hours</label>
          <input
            type="number"
            id="totalHours"
            name="totalHours"
            value={formData.totalHours}
            onChange={handleChange}
            placeholder="Enter total hours"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="numberOfAssessments">Number of Assessments</label>
          <input
            type="number"
            id="numberOfAssessments"
            name="numberOfAssessments"
            value={formData.numberOfAssessments}
            onChange={handleChange}
            placeholder="Enter number of assessments"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="assessments">Add Assessments</label>
          <input
            type="text"
            id="assessments"
            name="assessments"
            value={newAssessment}
            onChange={(e) => setNewAssessment(e.target.value)}
            placeholder="Enter assessment title"
          />
          <button type="button" onClick={handleAddAssessment}>
            Add Assessment
          </button>
        </div>

        {formData.assessments.length > 0 && (
          <div className="assessments-list">
            <h4>Assessments:</h4>
            <ul>
              {formData.assessments.map((assessment, index) => (
                <li key={index}>
                  {assessment}{" "}
                  <button type="button" onClick={() => handleRemoveAssessment(index)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

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
