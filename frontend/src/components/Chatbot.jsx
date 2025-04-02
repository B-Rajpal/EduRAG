import React, { useState, useRef, useEffect } from "react";
import "../styles/chatbox.css";
import axios from "axios";
import { FaPaperPlane } from "react-icons/fa";
import Loader from "./Loader";

const Chatbot = ({ subject, onQuerySubmit, onStart }) => {
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingScreen, setLoadingScreen] = useState(false);
  const [start, setStart] = useState(true);
  const [error, setError] = useState(null);
  const [uploadedfiles, setUploadedfiles] = useState([]);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch the list of uploaded files and update state
  const fetchFiles = async () => {
    if (subject) {
      try {
        const response = await axios.get(`http://localhost:5000/preview?subject=${subject}`);
        const filteredFiles = (response.data.files || []).filter(file => file !== "vector");
        setUploadedfiles(filteredFiles);
      } catch (err) {
        setError(`Error fetching files: ${err.message}`);
      }
    }
  };

  // Re-fetch uploaded files when the subject changes
  useEffect(() => {
    fetchFiles();
  }, [subject]);

  // Ensure files are detected before processing
  // useEffect(() => {
  //   if (uploadedfiles.length > 0) {
  //     setError(null);
  //   }
  // }, [uploadedfiles]);

  
  // Callback for processing files
  const handleStart = async () => {
    await fetchFiles(); // Fetch the latest files first
  
    // Use the latest files instead of uploadedfiles state
    const latestFilesResponse = await axios.get(`http://localhost:5000/preview?subject=${subject}`);
    const latestFiles = (latestFilesResponse.data.files || []).filter(file => file !== "vector");
  
    if (latestFiles.length === 0) {
      setError("No files available to process.");
      return;
    }
  
    setUploadedfiles(latestFiles); // Ensure state gets updated
    setLoadingScreen(true);
  
    try {
      const selectedFiles = latestFiles
        .filter(file => file.endsWith(".pdf"))
        .map(file => `E:\\final year project\\EduRAG\\backend\\uploads\\${subject}\\${file}`);
  
      console.log("Processing files:", selectedFiles);
  
      // Chunk processing
      const chunkResponse = await axios.post(
        "http://localhost:5000/chunk",
        { filePaths: selectedFiles, subject },
        { headers: { "Content-Type": "application/json" } }
      );
  
      console.log("Chunk response:", chunkResponse.data);
  
      // Initialize the model
      const modelResponse = await axios.post(
        "http://localhost:5000/initialize",
        {},
        { headers: { "Content-Type": "application/json" } }
      );
  
      console.log("Model initialization response:", modelResponse.data);
      onStart();
      setStart(false);
      setError(null);
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      setError("An error occurred during the process. Please try again.");
    } finally {
      setLoadingScreen(false);
    }
  };
          // Initialize the model
          useEffect(() => {
            if (uploadedfiles.length > 0) {
              setError(null); // Clear error if files exist
            }
          }, [uploadedfiles]);
          

  const handleSend = async () => {
    if (!input.trim()) return;

    setChatHistory((prev) => [...prev, { role: "User", message: input }]);
    setInput("");
    setLoadingScreen(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/rag",
        { query: input, subject },
        { headers: { "Content-Type": "application/json" } }
      );

      setChatHistory((prev) => [
        ...prev,
        { role: "Bot", message: response.data.answer || "No response received.", isHtml: true },
      ]);

      if (onQuerySubmit) {
        const queryPoint = response.data.query_point;
        const all_embeddings = response.data.existing_embeddings;
        const reference_embeddings = response.data.reference_embeddings;
        onQuerySubmit(queryPoint, all_embeddings, reference_embeddings);
      }
    } catch (err) {
      setError("Error processing your request.");
      setChatHistory((prev) => [
        ...prev,
        { role: "Bot", message: "There was an error. Please try again." },
      ]);
    } finally {
      setLoadingScreen(false);
    }
  };

  // Scroll to the end of the chat when the chat history updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  return (
    <div className="chatbox">
      {loadingScreen && (
        <div className="loading-overlay">
          <Loader />
        </div>
      )}

      <div className="chathistory">
        {chatHistory.map((chat, index) => (
          <div
            key={index}
            style={{
              textAlign: chat.role === "User" ? "right" : "left",
              backgroundColor: chat.role === "User" ? "orange" : "yellow",
              margin: "5px 0",
              padding: "5px 10px",
              borderRadius: "10px",
              display: "inline-block",
              wordWrap: "break-word",
            }}
            className="div1"
          >
            <strong>{chat.role}:</strong>
            {chat.isHtml ? (
              <div dangerouslySetInnerHTML={{ __html: chat.message }}></div>
            ) : (
              chat.message
            )}
            <br />
          </div>
        ))}
        <div ref={chatEndRef}></div>
      </div>

      {start && !error ? (
        <button onClick={handleStart} disabled={loadingScreen}>
          Start
        </button>
      ) : (
        <div className="inputbox">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Type your question..."
            rows="1"
            disabled={loadingScreen}
          ></textarea>
          <FaPaperPlane onClick={handleSend} disabled={loadingScreen || error} />
          <button
            className="toggle-button-quiz"
            onClick={() => window.location.href = `/quiz?subject=${subject}`}
          >
            Quiz
          </button>
        </div>
      )}

      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default Chatbot;
