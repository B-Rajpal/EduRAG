import React, { useEffect, useState } from "react";
import axios from "axios";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const userId = localStorage.getItem("userId"); // Retrieve userId from localStorage

      if (!userId) {
        setError("You are not logged in.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get("http://localhost:5001/profile", {
          headers: { Authorization: userId }, // Send userId in the headers
        });

        setUser(response.data.user);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to fetch profile details.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) return <div>Loading...</div>;
 
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  return (
    <div className="profile-container">
      {user ? (
        <div className="profile-card">
        <h1 className="profile-title">
          Welcome, {user.first_name} {user.last_name}
        </h1>
        <div className="profile-details">
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
        </div>
      </div>
      ) : (
        <div className="loading-message">Loading profile...</div>
      )}
    </div>
  );
};

export default Profile;
