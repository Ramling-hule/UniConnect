"use client";
import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import { API_BASE_URL } from "@/utils/config";

const ChatbotPage = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "ai",
      content: "Hello! I am UniConnect AI. I can write code, lists, and tables for you.",
    },
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

 const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content }),
      });

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      setMessages((prev) => [...prev, { role: "ai", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // ✅ CORRECT: Create a NEW object instead of mutating the old one
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMsgIndex = newMessages.length - 1;

          // Create a shallow copy of the last message
          const updatedLastMsg = {
            ...newMessages[lastMsgIndex],
            content: newMessages[lastMsgIndex].content + chunk,
          };

          // Replace the old message with the new copy
          newMessages[lastMsgIndex] = updatedLastMsg;
          
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <style>{`
        /* Streamlit-style blinking cursor */
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .cursor {
          display: inline-block;
          width: 8px;
          height: 18px;
          background-color: #ff4b4b; /* Streamlit Red/Orange */
          margin-left: 4px;
          animation: blink 1s step-end infinite;
          vertical-align: text-bottom;
        }
        /* Markdown Styles */
        .markdown-body p { margin: 5px 0; }
        .markdown-body pre { border-radius: 8px; overflow: hidden; }
      `}</style>

      <div style={styles.chatContainer}>
        <div style={styles.header}>UniConnect AI</div>

        <div style={styles.messagesArea}>
          {messages.map((msg, index) => (
            <div key={index} style={msg.role === "user" ? styles.userRow : styles.aiRow}>
              
              {/* Message Bubble */}
              <div style={msg.role === "user" ? styles.userBubble : styles.aiBubble}>
                {msg.role === "user" ? (
                  // User messages are just plain text
                  msg.content
                ) : (
                  // AI messages are rendered as Rich Markdown
                  <div className="markdown-body">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || "");
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={dracula}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} style={styles.inlineCode} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {/* While streaming, we add the cursor to the end of the text temporarily */}
                      {msg.content + (isStreaming && index === messages.length - 1 ? " " : "")}
                    </ReactMarkdown>
                    
                    {/* The Cursor Element (Only shows when streaming this specific message) */}
                    {isStreaming && index === messages.length - 1 && (
                      <span className="cursor"></span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div style={styles.inputArea}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your message..."
            style={styles.input}
            disabled={isStreaming}
          />
          <button onClick={handleSend} style={styles.sendButton} disabled={isStreaming}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Styles ---
const styles = {
  pageContainer: {
    height: "100vh",
    backgroundColor: "#f0f2f6",
    display: "flex",
    justifyContent: "center",
    paddingTop: "20px",
    fontFamily: "sans-serif",
  },
  chatContainer: {
    width: "100%",
    maxWidth: "700px",
    height: "90vh",
    backgroundColor: "white",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    padding: "15px",
    backgroundColor: "blue", // Streamlit Red
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  messagesArea: {
    flex: 1,
    padding: "20px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  userRow: { display: "flex", justifyContent: "flex-end" },
  aiRow: { display: "flex", justifyContent: "flex-start" },
  userBubble: {
    backgroundColor: "blue",
    color: "white",
    padding: "10px 15px",
    borderRadius: "15px 15px 0 15px",
    maxWidth: "80%",
  },
  aiBubble: {
    backgroundColor: "#f0f2f6",
    color: "black",
    padding: "10px 15px",
    borderRadius: "15px 15px 15px 0",
    maxWidth: "85%", // Slightly wider for code blocks
    lineHeight: "1.6",
  },
  inlineCode: {
    backgroundColor: "#e3e6e8",
    padding: "2px 5px",
    borderRadius: "4px",
    fontFamily: "monospace",
  },
  inputArea: {
    padding: "15px",
    borderTop: "1px solid #ddd",
    display: "flex",
    gap: "10px",
    backgroundColor: "white",
  },
  input: {
    flex: 1,
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    color: "#000",
  },
  sendButton: {
    padding: "10px 20px",
    backgroundColor: "blue",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};

export default ChatbotPage;