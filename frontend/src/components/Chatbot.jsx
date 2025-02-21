import React, { useState, useRef, useEffect } from "react";
import "../styles/chatbox.css";
import axios from "axios";
import { FaPaperPlane } from "react-icons/fa";
import Loader from "./Loader";

const Chatbot = ({ subject, onQuerySubmit }) => { // Add onQuerySubmit as a prop
  const [input, setInput] = useState(""); // For user input
  const [chatHistory, setChatHistory] = useState([]); // To store chat history
  const [loadingScreen, setLoadingScreen] = useState(false); // State for loading overlay
  const [start, setStart] = useState(true);
  const [error, setError] = useState(false);
  const [uploadedfiles, setUploadedfiles] = useState([]);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch the list of uploaded files
  const fetchFiles = () => {
    if (subject) {
      axios
        .get(`http://localhost:5000/preview?subject=${subject}`)
        .then((response) => {
          const filteredFiles = (response.data.files || []).filter((file) => file !== "vector");
          setUploadedfiles(filteredFiles);
        })
        .catch((err) => setError(`Error fetching files: ${err.message}`));
    }
  };

  // Fetch files when the subject changes
  useEffect(() => {
    fetchFiles();
  }, [subject]);

  // Callback for file upload success
  
  const handleStart = async () => {
    if (!uploadedfiles.length) {
      setError("No files available to process.");
      return;
    }

    setLoadingScreen(true);

    try {
      // Prepare file paths dynamically based on the subject
      const selectedFiles = uploadedfiles
        .filter((file) => file.endsWith(".pdf"))
        .map((file) => `E:\\Finalyear_project\\EduRAG\\backend\\uploads\\${subject}\\${file}`);
      console.log("Processing files:", selectedFiles);

      // Call the chunk endpoint
      const chunkResponse = await axios.post(
        "http://localhost:5000/chunk",
        {
          filePaths: selectedFiles,
          subject: subject,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Chunk response:", chunkResponse.data);

      // Initialize the model
      const modelResponse = await axios.post(
        "http://localhost:5000/initialize",
        {},
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Model initialization response:", modelResponse.data);

      setStart(false);
      setError(null);
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      setError("An error occurred during the process. Please try again.");
    } finally {
      setLoadingScreen(false);
    }
  };

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

      // Send query to ClassDetails for visualization
      if (onQuerySubmit) {
        const queryPoint = response.data.query_point; // Assuming query_point is in the response
        const all_embeddings = response.data.existing_embeddings;
        const reference_embeddings = response.data.reference_embeddings;
        onQuerySubmit(queryPoint,all_embeddings,reference_embeddings); // Send the query point for visualization
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
      {loadingScreen && <div className="loading-overlay"><Loader /></div>}

      
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
        <button onClick={handleStart} disabled={loadingScreen}>Start</button>
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
        </div>
      )}

      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default Chatbot;
