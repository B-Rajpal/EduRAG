import React, { useState, useRef, useEffect } from "react";
import "../styles/chatbox.css";
import axios from 'axios';

const Chatbot = () => {
  const [input, setInput] = useState(""); // For user input
  const [chatHistory, setChatHistory] = useState([]); // To store chat history
  const chatEndRef = useRef(null);

  const handleSend = async () => {
    if (!input.trim()) return;

    const filePath = "E:\\Finalyear_project\\EduRAG\\backend\\example1.pdf"; // File path for testing

    const userMessage = { role: "User", message: input };
    setChatHistory((prev) => [...prev, userMessage]); // Add user message immediately

    try {
      // Step 1: Chunk the file
      const chunkResponse = await axios.post(
        'http://localhost:5000/chunk',
        { filePath }, // Pass filePath as JSON
        {
          headers: {
            'Content-Type': 'application/json', // Explicitly set content type
          },
        }
      );

      console.log("Chunk response:", chunkResponse.data);

      // Step 2: Call RAG pipeline
      const ragResponse = await axios.post(
        'http://localhost:5000/rag',
        { query: input }, // Pass user input as query
        {
          headers: {
            'Content-Type': 'application/json', // Explicitly set content type
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
    }

    setInput(""); // Clear input after sending
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
              textAlign: chat.role === "User" ? "right" : "left",
              backgroundColor: chat.role === "User" ? "orange" : "yellow",
              margin: "5px 0",
              padding: "5px 10px",
              borderRadius: "10px",
              display: "inline-block",
              maxWidth: "70%",
              wordWrap: "break-word",
            }}
          >
            <strong>{chat.role}:</strong> {chat.message}
          </div>
        ))}
        <div ref={chatEndRef}></div>
      </div>
      <div className="inputbox">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default Chatbot;
