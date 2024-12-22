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
  const [start, setStart] = useState(true);

  const handleStart = async () => {
    setLoading(true);
    const filePath = "E:\\Finalyear_project\\EduRAG\\backend\\example1.pdf"; // File path for testing
    setStart(false);
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
      )
        .finally(() => {
          setLoading(false);
        });

      console.log("Chunk response:", chunkResponse.data);
      const modelstart = await axios.post('http://localhost:5000/initialize', {
        headers: {
          'Content-Type': 'application/json', // Explicitly set content type
        },
      });
      console.log("model initialization response:", modelstart.data);
    }
    catch (error) {
      console.error("Error:", error.response?.data || error.message);

      const botErrorResponse = {
        role: "Bot",
        message: "There was an error processing your request. Please try again.",
      };
      setChatHistory((prev) => [...prev, botErrorResponse]);
    }
  }

  const handleSend = async () => {
    setLoading(true);
    if (!input.trim()) return;
    const userMessage = { role: "User", message: input };
    setChatHistory((prev) => [...prev, userMessage]); // Add user message immediately

    try {
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
        isHtml: true, // Mark this response as HTML content
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
            <strong>{chat.role}:</strong> 
            {chat.isHtml ? (
              <div dangerouslySetInnerHTML={{ __html: chat.message }} />
            ) : (
              chat.message
            )}
          </div>
        ))}
        <div>{loading ? <Loader /> : ""}</div>
        <div ref={chatEndRef}></div>
      </div>
      {start ? (
        <div>
          <button onClick={handleStart} className="startchat">Start</button>
        </div>
      ) : (
        <div className="inputbox">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
          />
          <button onClick={handleSend}>Send</button>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
