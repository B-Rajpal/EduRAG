import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/profile.css";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [groupedFiles, setGroupedFiles] = useState({});
  const [assessments, setAssessments] = useState([]);
  const [classHours, setClassHours] = useState({});
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  // Static timetable data
  const timetable = [
    { date: "2025-01-15", event: "Math Exam" },
    { date: "2025-01-20", event: "Science Practical" },
    { date: "2025-02-05", event: "History Quiz" },
    { date: "2025-02-10", event: "Semester End Exam" },
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        // Fetch profile data
        const response = await axios.get("http://localhost:5001/profile", {
          headers: { Authorization: userId },
        });
        setUser(response.data.user);
        setFormData(response.data.user);

        // Fetch assessments (assuming backend doesn't return completed field)
        const assessmentsResponse = await axios.get("http://localhost:5001/assessments", {
          headers: { Authorization: userId },
        });

        // Add `completed` field to each assessment if not present
        const assessmentsWithStatus = assessmentsResponse.data.classes.map(assessment => ({
          ...assessment,
          completed: localStorage.getItem(`assessment-${assessment.id}`) === "true", // Load the state from localStorage
        }));
        setAssessments(assessmentsWithStatus);

        // Fetch class hours
        const classHoursResponse = await axios.get("http://localhost:5001/total-hours", {
          headers: { Authorization: userId },
        });

        // Check if the structure is as expected
        if (Array.isArray(classHoursResponse.data.classes)) {
          const classHoursMap = classHoursResponse.data.classes.reduce((acc, classInfo) => {
            const { title, total_hours } = classInfo;
            acc[title] = {
              totalHours: total_hours,
              hoursSpent: localStorage.getItem(`class-${title}`) || 0, // Load the hoursSpent from localStorage
            }; 
            return acc;
          }, {});
          setClassHours(classHoursMap);
        } else {
          throw new Error("Class hours data is not in expected format.");
        }

        // Fetch files
        const filesResponse = await axios.get("http://localhost:5000/preview");
        const files = filesResponse.data.files;
        const filteredfiles = files.map((file) => ({
          ...file,
          files: file.files.filter((fileName) => fileName !== "vector_store"),
        }));
        const grouped = filteredfiles.reduce((acc, file) => {
          const { subject, files: fileNames } = file;
          if (!acc[subject]) {
            acc[subject] = [];
          }
          acc[subject] = [...acc[subject], ...fileNames];
          return acc;
        }, {});
        setGroupedFiles(grouped);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to fetch profile details.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const handleLogout = () => {
    localStorage.removeItem("userId");
    navigate("/login");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.put("http://localhost:5001/profile", formData, {
        headers: { Authorization: userId },
      });

      setUser(response.data.updatedUser); // Assuming the updated user is returned
      setFormData(response.data.updatedUser);
      setIsEditing(false); // Exit editing mode
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

    // Optionally send the updated state to the backend
   
  
  

  const handleHoursUpdate = (className, newHours) => {
    setClassHours((prev) => {
      const updatedClassHours = {
        ...prev,
        [className]: { ...prev[className], hoursSpent: newHours },
      };
      // Save the updated hours in localStorage
      localStorage.setItem(`class-${className}`, newHours);
      return updatedClassHours;
    });
  };

  if (loading && !user) return <div className="loading-message">Loading profile...</div>;

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-actions">
        <button className="back-button" onClick={() => navigate("/")}>
          &larr; Back
        </button>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {user ? (
        <div className="profile-card">
          <div className="profile-content">
            {/* Left Section: Profile Details */}
            <div className="profile-details-section">
              <img className="profile-picture" />
              <h1 className="profile-title">
                Welcome, {user.first_name} {user.last_name}
              </h1>
              <div className="profile-details">
                {isEditing ? (
                  <form className="edit-profile-form">
                    <label>
                      First Name:
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                      />
                    </label>
                    <label>
                      Last Name:
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                      />
                    </label>
                    <label>
                      Email:
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </label>
                    <label>
                      School:
                      <input
                        type="text"
                        name="school_name"
                        value={formData.school_name}
                        onChange={handleInputChange}
                      />
                    </label>
                    <label>
                      Country:
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                      />
                    </label>
                    <button type="button" onClick={handleUpdateProfile}>
                      Save
                    </button>
                    <button type="button" onClick={() => setIsEditing(false)}>
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <p>
                      <strong>Email:</strong> {user.email}
                    </p>
                    <p>
                      <strong>School:</strong> {user.school_name}
                    </p>
                    <p>
                      <strong>Country:</strong> {user.country}
                    </p>
                    <p>
                      <strong>Role:</strong> {user.role}
                    </p>
                    <button onClick={() => setIsEditing(true)}>Edit Profile</button>
                  </>
                )}
              </div>
              <div className="timetable-section">
                <h2>Semester Timetable</h2>
                {timetable.length > 0 ? (
                  <ul>
                    {timetable.map((entry, index) => (
                      <li key={index}>
                        <strong>{entry.date}</strong>: {entry.event}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No timetable available.</p>
                )}
              </div>
              <div className="assessments-section">
  <h2>Assessments Checklist</h2>
  <p>
    Completed: {assessments.filter((assessment) => assessment.completed).length} / {assessments.length}
  </p>

  {assessments.length > 0 ? (
    assessments.map((assessment) => (
      <div key={assessment.title} className="assessment-group">
        <h3>{assessment.title}</h3>
        <div className="assessment-items">
          {assessment.assessments.map((assessmentName) => {
            // Find the assessment object by name
            const assessmentDetails = assessment.assessments.find(
              (assess) => assess.name === assessmentName
            );

            return (
              <div key={assessmentName} className="assessment-item">
                <label>
                 
                  {assessmentName} {/* Show the name of the assessment */}
                </label>
              </div>
            );
          })}
        </div>
      </div>
    ))
  ) : (
    <p>No assessments available.</p>
  )}
</div>

              <div className="class-hours-section">
                <h2>Class Hours Tracker</h2>
                {Object.keys(classHours).map((className) => {
                  const { totalHours, hoursSpent } = classHours[className];
                  return (
                    <div key={className} className="class-hours-item">
                      <p><strong>{className}</strong></p>
                      <p>
                        Hours Spent: {hoursSpent} / {totalHours}
                      </p>
                      <input
                        type="number"
                        value={hoursSpent}
                        max={totalHours}
                        onChange={(e) =>
                          handleHoursUpdate(className, Math.min(Number(e.target.value), totalHours))
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Section: Files */}
            <div className="profile-files-section">
              <h2>Attached Files:</h2>
              {Object.keys(groupedFiles).length > 0 ? (
                Object.keys(groupedFiles).map(
                  (subject) =>
                    groupedFiles[subject].length > 0 && (
                      <div key={subject} className="file-card">
                        <h3 className="file-card-title">{subject}</h3>
                        <ul className="file-list">
                          {groupedFiles[subject].map((file, index) => (
                            <li key={index} className="file-item">
                              {file}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                )
              ) : (
                <p>No files attached.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="loading-message">Loading profile...</div>
      )}
    </div>
  );
};

export default Profile;
