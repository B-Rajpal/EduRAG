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
  const [ref_tsneData, setRef_tsneData] = useState([]);
  const [queryPoint, setQueryPoint] = useState(null); // For dynamic updates to t-SNE
  const [showChunkedData, setShowChunkedData] = useState(false);
  const [showReferenceData, setShowReferenceData] = useState(false);
  const [showTsneVisualization, setShowTsneVisualization] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

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

  const formatText = (text, maxLength = 30) => {
    return text.length > maxLength
      ? text.match(new RegExp(`.{1,${maxLength}}`, "g")).join("<br>")
      : text;
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

  const handleQuerySubmit = (point, all_embeddings, reference_embeddings) => {
    if (point) {
      setQueryPoint(point);
    }
    if (all_embeddings) {
      setTsneData(all_embeddings);
    }
    if (reference_embeddings) {
      setRef_tsneData(reference_embeddings);
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
          <button className="toggle-button" onClick={() => navigate(`/quiz?subject=${selectedClass.class.title}`)}>
            Quiz
          </button>
          </div>
          <button className="toggle-button" onClick={() => setShowPreview(!showPreview)}>
  Preview files
</button>
<div className="list">

{showPreview && (
  <div className="file-preview">
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
)}

        <button className="toggle-button" onClick={() => setShowChunkedData(!showChunkedData)}>Chunked Data</button>
        {showChunkedData &&
          <div className="chunked-data">
            <h2>Chunked Data</h2>
            {tsneData.length > 0 ? (
              <ul>
                {tsneData.map((point, index) => (
                  <li key={index} className="chunk-item">
                    {point.text}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No chunked data available.</p>
            )}
          </div>}
        <button className="toggle-button" onClick={() => setShowReferenceData(!showReferenceData)}>Reference Data</button>
        {showReferenceData && 
        <div className="reference-data">
           <h2>Referenced Data</h2>
            {tsneData.length > 0 ? (
              <ul>
                {ref_tsneData.map((point, index) => (
                  <li key={index} className="reference-item">
                    {point.text}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No reference data available.</p>
            )}
          </div>}
        <button className="toggle-button" onClick={() => setShowTsneVisualization(!showTsneVisualization)}>t-SNE Visualization</button>
        {showTsneVisualization && (
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
                    text: tsneData.map((point) => formatText(point.text, 30)), // Labels on hover
                    hoverinfo: "text", // Ensures text is displayed on hover
                    marker: { color: "blue", size: 10 },
                    textfont: { family: "Arial", size: 12, color: "black" }
                  },
                  queryPoint && {
                    x: [queryPoint.x],
                    y: [queryPoint.y],
                    mode: "markers",
                    type: "scatter",
                    text: [formatText(queryPoint.text, 30)], // Label for query point
                    hoverinfo: "text",
                    marker: { color: "red", size: 12 },
                  },
                  ref_tsneData && {
                    x: ref_tsneData.map((point) => point.x),
                    y: ref_tsneData.map((point) => point.y),
                    mode: "markers",
                    type: "scatter",
                    text: ref_tsneData.map((point) => formatText(point.text, 30)), // Labels on hover
                    hoverinfo: "text", // Ensures text is displayed on hover
                    marker: { color: "green", size: 10 },
                    textfont: { family: "Arial", size: 12, color: "black" }
                  }
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
          </div>)}

        <Chatbot subject={selectedClass.class.title} onQuerySubmit={handleQuerySubmit} onStart={fetchTsneData} />
      
    </div></div>
  </div>
  );
};

export default ClassDetails;