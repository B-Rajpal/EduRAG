import React, { useState, useRef, useEffect } from "react";
import "../styles/chatbox.css";
import axios from "axios";
import { FaPaperPlane } from "react-icons/fa"; // Import the FaPaperPlane icon
import Loader from "./Loader";
const Chatbot = () => {
  const [input, setInput] = useState(""); // For user input
  const [chatHistory, setChatHistory] = useState([]); // To store chat history
  const chatEndRef = useRef(null);
  const inputRef = useRef(null); // Reference for the input textarea
  const [loading, setLoading] = useState(false);
  const [heightAdjusted, setHeightAdjusted] = useState(false); // State to track if the height adjustment should occur

  const handleSend = async () => {
    if (!input.trim()) return; // Prevent sending empty messages
    setLoading(true);

    const filePath = "H:/frontend/EduRAG/backend/example1.pdf"; // Make sure this is correct

    const userMessage = { role: "User", message: input };
    setChatHistory((prev) => [...prev, userMessage]); // Add user message immediately

    try {
      // Step 1: Chunk the file
      const chunkResponse = await axios.post(
        "http://localhost:5000/chunk",
        { filePath }, // Pass filePath as JSON
        {
          headers: {
            "Content-Type": "application/json", // Explicitly set content type
          },
        }
      );

      console.log("Chunk response:", chunkResponse.data);

      // Step 2: Call RAG pipeline
      const ragResponse = await axios.post(
        "http://localhost:5000/rag",
        { query: input }, // Pass user input as query
        {
          headers: {
            "Content-Type": "application/json", // Explicitly set content type
          },
        }
      );

      console.log("RAG response:", ragResponse.data);

      const botResponse = {
        role: "Bot",
        message: ragResponse.data.answer || "No response received.",
      };

      setChatHistory((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);

      const botErrorResponse = {
        role: "Bot",
        message: "There was an error processing your request. Please try again.",
      };

      setChatHistory((prev) => [...prev, botErrorResponse]);
    } finally {
      setLoading(false);
      setInput(""); // Clear input after sending
      resetInputSize(); // Reset input size after sending
    }
  };

  // Handle the "Enter" key for sending messages and "Shift + Enter" for new lines
  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey && input.trim()) {
      event.preventDefault(); // Prevent default behavior (like a newline)
      handleSend(); // Send the message when Enter is pressed
    } else if (event.key === "Enter" && event.shiftKey) {
      return;
    }
  };

  // Adjust the height of the textarea based on the content (only after the first line is filled)
  const handleInputChange = (e) => {
    const textarea = e.target;
    if (!heightAdjusted && textarea.scrollHeight > textarea.clientHeight) {
      // Allow height adjustment only if the content overflows after the first line
      setHeightAdjusted(true);
    }

    if (heightAdjusted) {
      textarea.style.height = "auto"; // Reset height to auto to allow resizing
      textarea.style.height = `${textarea.scrollHeight}px`; // Adjust height based on scrollHeight
    }

    setInput(textarea.value); // Update the state with the input value
  };

  // Reset input field size to original size (min height)
  const resetInputSize = () => {
    if (inputRef.current) {
      inputRef.current.style.height = "20px"; // Reset height to default (or a min height)
      setHeightAdjusted(false); // Reset height adjustment state
    }
  };

  // Scroll to the bottom whenever the chatHistory changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  return (
    <div className="chatbox">
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
          >
            <strong>{chat.role}:</strong> {chat.message}
          </div>
        ))}
        {loading && <div><Loader/></div>}
        <div ref={chatEndRef}></div>
      </div>
      <div className="inputbox">
        <textarea
          ref={inputRef}
          value={input} // Controlled input (value tied to state)
          onChange={handleInputChange} // Update input value as the user types
          onKeyDown={handleKeyPress} // Handle key events (e.g., Enter)
          placeholder="Type your question..."
          rows="1"
          style={{
            resize: "none", // Disabling manual resize to control the height via JS
            minHeight: "40px", // Minimum height for the input (change this as needed)
            width: "100%", // Ensure it takes full width
            padding: "10px",
            fontSize: "16px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        ></textarea>
        <FaPaperPlane className="send-icon" onClick={handleSend} />
        </div>
    </div>
  );
};

export default Chatbot;
