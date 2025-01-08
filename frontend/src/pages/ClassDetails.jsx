import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/classdetails.css";
import Chatbot from "../components/Chatbot";
import { GoArrowLeft } from "react-icons/go";
import FileUpload from "../components/Fileupload";
import axios from "axios";
import Plot from "react-plotly.js";

const ClassDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState(null);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tsneData, setTsneData] = useState([]);
  const [queryPoint, setQueryPoint] = useState(null); // For dynamic updates to t-SNE

  useEffect(() => {
    const fetchClassDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/classes/${id}`);
        setSelectedClass(response.data);
      } catch (err) {
        setError("Class not found.");
      }
    };
    fetchClassDetails();
  }, [id]);

  const fetchFiles = () => {
    if (selectedClass) {
      setIsLoading(true);
      axios
        .get(`http://localhost:5000/preview?subject=${selectedClass.class.title}`)
        .then((response) => {
          setFiles(response.data.files || []);
          setError(null);
        })
        .catch((err) => setError(err.message))
        .finally(() => setIsLoading(false));
    }
  };

  const fetchTsneData = () => {
    if (selectedClass) {
      axios
        .post(`http://localhost:5000/tsne`, {
          subject: selectedClass.class.title,
        })
        .then((response) => {
          const data = Array.isArray(response.data.data) ? response.data.data : [];
          console.log(data);
          setTsneData(data);
        })
        .catch((err) => {
          setError("Error fetching t-SNE data");
          console.error("Error:", err);
        });
    }
  };

  useEffect(() => {
    if (selectedClass) {
      fetchFiles();
      fetchTsneData();
    }
  }, [selectedClass]);

  const handleDeleteClass = async () => {
    try {
      await axios.delete(`http://localhost:5001/classes/${id}`);
      alert("Class deleted successfully.");
      navigate("/");
    } catch (error) {
      console.error("Error deleting class:", error);
      alert("Failed to delete class.");
    }
  };

  const handleDeleteFile = async (fileName) => {
    try {
      await axios.delete(`http://localhost:5000/delete`, {
        data: { fileName, subject: selectedClass.class.title },
      });
      alert(`${fileName} deleted successfully.`);
      fetchFiles();
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Failed to delete file.");
    }
  };

  const handleQuerySubmit = (point) => {
    if (point) {
      setQueryPoint(point);
    }
  };

  if (error) {
    return (
      <div className="class-details-container">
        <h1>{error}</h1>
        <button className="back-button" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
    );
  }

  if (!selectedClass) {
    return <p>Loading...</p>;
  }

  return (
    <div className="class-details-container">
      <button className="back-button" onClick={() => navigate(-1)}>
        <GoArrowLeft />
      </button>

      <button className="delete-class-button" onClick={handleDeleteClass}>
        Delete Class
      </button>

      <div className="class-info">
        <h1 className="class-title">{selectedClass.class.title}</h1>
        <p className="class-teacher">Taught by: {selectedClass.class.teacher}</p>
        <p className="class-description">{selectedClass.class.description}</p>

        <FileUpload subject={selectedClass.class.title} onFileUpload={fetchFiles} />

        <div className="file-preview">
          <h2>Preview Files</h2>
          {error && <p className="error">{error}</p>}
          {isLoading ? (
            <p>Loading files...</p>
          ) : files.length > 0 ? (
            <ul>
              {files.map((file, index) => (
                <li key={index}>
                  {file}
                  <button
                    onClick={() => handleDeleteFile(file)}
                    className="delete-button"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No files available for this subject.</p>
          )}
        </div>

        <div className="tsne-preview">
          <h2>t-SNE Visualization</h2>
          {tsneData && tsneData.length > 0 ? (
            <Plot
              data={[
                {
                  x: tsneData.map((point) => point.x),
                  y: tsneData.map((point) => point.y),
                  mode: "markers",
                  type: "scatter",
                  marker: { color: "blue", size: 10 },
                },
                queryPoint && {
                  x: [queryPoint.x],
                  y: [queryPoint.y],
                  mode: "markers",
                  type: "scatter",
                  marker: { color: "red", size: 12 },
                  name: "Query Point",
                },
              ].filter(Boolean)}
              layout={{
                title: "t-SNE Visualization",
                xaxis: { title: "Dimension 1" },
                yaxis: { title: "Dimension 2" },
              }}
            />
          ) : (
            <p>No valid t-SNE data available to display. Please check the backend response.</p>
          )}
        </div>

        <Chatbot subject={selectedClass.class.title} onQuerySubmit={handleQuerySubmit} />
      </div>
    </div>
  );
};

export default ClassDetails;
