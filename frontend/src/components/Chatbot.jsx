import React, { useState,useRef,useEffect } from "react";
import "../styles/chatbox.css"

const Chatbot = () => {
  const [input, setInput] = useState(""); // For user input
  const [chatHistory, setChatHistory] = useState([]); // To store chat history
  const chatEndRef = useRef(null);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { role: "User", message: input };
    const botResponse = {
      role: "Bot",
      message: `You said: "${input}"`, // Replace with your response generation logic
    };

    setChatHistory([...chatHistory, userMessage, botResponse]);
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
              backgroundColor : chat.role ==="User" ? "orange": "yellow",
              margin: "5px 0",
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
        <button onClick={handleSend}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
