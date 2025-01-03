import React, { useState, useRef, useEffect } from "react";
import "../styles/chatbox.css";
import axios from "axios";
import { FaPaperPlane } from "react-icons/fa";
import Loader from "./Loader";

const Chatbot = ({ subject }) => {
  const [input, setInput] = useState(""); // For user input
  const [chatHistory, setChatHistory] = useState([]); // To store chat history
  const [loadingScreen, setLoadingScreen] = useState(false); // State for loading overlay
  const [start, setStart] = useState(true);  
  const [error, setError] = useState(false);  
  const chatEndRef = useRef(null);
  const inputRef = useRef(null); 

  const handleStart = async () => {
    setLoadingScreen(true); // Show loading screen
    const files = ["E:\\Finalyear_project\\EduRAG\\backend\\example1.pdf"];
    setStart(false);
    setError(false);  // Reset error state before trying to start

    try {
      // Initialize the model
      const modelResponse = await axios.post(
        "http://localhost:5000/initialize",
        {},
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("Model initialization response:", modelResponse.data);
      // Chunk the files and initialize the model
      const chunkResponse = await axios.post(
        "http://localhost:5000/chunk",
        {
          filePaths: files,
          subject: subject, // Specify a default subject or make this dynamic
        },
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("Chunk response:", chunkResponse.data);
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      setError(true); // Set error state when there is an error
      setChatHistory((prev) => [
        ...prev,
        {
          role: "Bot",
          message: "There was an error starting the chat. Please try again.",
        },
      ]);
    } finally {
      setLoadingScreen(false); // Hide loading screen
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "User", message: input };
    setChatHistory((prev) => [...prev, userMessage]); // Add user message
    setInput(""); // Clear input
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = "auto"; // Reset to original size
    }
    setLoadingScreen(true); // Show loading screen
    setError(false); // Reset error state before sending

    try {
      // Call RAG pipeline
      const response = await axios.post(
        "http://localhost:5000/rag",
        { query: input, subject: subject }, // Use the same subject as in handleStart
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("RAG response:", response.data);

      const botResponse = {
        role: "Bot",
        message: response.data.answer || "No response received.",
        isHtml: true, // Mark as HTML content
      };

      setChatHistory((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      setError(true); // Set error state when there is an error
      setChatHistory((prev) => [
        ...prev,
        {
          role: "Bot",
          message: "There was an error processing your request. Please try again.",
        },
      ]);
    } finally {
      setLoadingScreen(false); // Hide loading screen
    }
  };

  // Scroll to the bottom whenever the chatHistory changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Handle "Enter" key for sending messages
  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey && input.trim()) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    adjustTextareaHeight();
  };

  const adjustTextareaHeight = () => {
    const textarea = inputRef.current;
    if (textarea) {
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight, 10); // Get line-height in pixels
      const maxLines = 5; // Maximum number of lines before enabling scroll
      const maxHeight = lineHeight * maxLines;

      // Reset height to auto to shrink the height on delete
      textarea.style.height = "auto";

      // Adjust height based on scrollHeight
      if (textarea.scrollHeight > maxHeight) {
        textarea.style.height = `${maxHeight}px`;
        textarea.style.overflowY = "scroll"; // Enable scroll when exceeding 3 lines
      } else {
        textarea.style.height = `${textarea.scrollHeight}px`;
        textarea.style.overflowY = "hidden"; // Hide scroll otherwise
      }
    }
  };

  return (
    <div className="chatbox">
      <div className="chathistory">
        {/* Semi-transparent overlay when loading */}
        {loadingScreen && (
          <div className="loading-overlay">
            <Loader />
          </div>
        )}

        {/* Chat messages */}
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
          >
            <strong>{chat.role}:</strong>
            {chat.isHtml ? (
              <div dangerouslySetInnerHTML={{ __html: chat.message }}></div>
            ) : (
              chat.message
            )}
          </div>
        ))}
        <div ref={chatEndRef}></div>
      </div>

      {/* Start button or input area */}
      {start && !error ? (
        <button onClick={handleStart} className="startchat" disabled={loadingScreen}>
          Start
        </button>
      ) : !error &&(
        <div className="inputbox">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder="Type your question..."
              rows="1"
              style={{
                resize: "none",
                width: "100%",
                padding: "10px",
                fontSize: "16px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                lineHeight: "24px", // Set a fixed line height (e.g., 24px)
              }}
              disabled={loadingScreen} // Disable the textarea when loading
            ></textarea>
          
       
          <FaPaperPlane
            className="send-icon"
            onClick={handleSend}
            disabled={loadingScreen || error} // Disable the send button if there's an error
          />
        </div>
      )}
    </div>
          
  );
};

export default Chatbot;
