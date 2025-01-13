import React, { useState, useRef, useEffect } from "react";
import "../styles/chatbox.css";
import axios from "axios";
import { FaPaperPlane } from "react-icons/fa";
import Loader from "./Loader";

const Chatbot = ({ subject }) => {
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingScreen, setLoadingScreen] = useState(false);
  const [start, setStart] = useState(true);
  const [error, setError] = useState(null);
  const [uploadedfiles, setUploadedfiles] = useState([]);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

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

  useEffect(() => {
    fetchFiles();
  }, [subject]);

  const handleStart = async () => {
    if (!uploadedfiles.length) {
      setError("No files available to process.");
      return;
    }

    setLoadingScreen(true);
    try {
      const selectedFiles = uploadedfiles.map(
        (file) => `E:\\Finalyear_project\\EduRAG\\backend\\${file}`
      );
      console.log("Processing files:", selectedFiles);
      setStart(false);
      setError(null);
    } catch (err) {
      setError("An error occurred while starting the process.");
      console.error(err);
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
              textAlign: chat.role === "User" ? "right" : "left", // Align based on role
              backgroundColor: chat.role === "User" ? "orange" : "yellow",
              margin: "5px 0",
              padding: "5px 10px",
              borderRadius: "10px",
              display: "inline-block",
              maxWidth: "70%", // Adjust max width for chat bubbles
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
            <br/>
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
