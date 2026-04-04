import { useState, useEffect, useRef } from "react";
import { useChatSocket } from "../hook/useChatSocket";

// These would come from your auth context in a real app
const MY_USER_ID = "user_123";
const PROVIDER_ID = "provider_456";

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  const { sendMessage, connected } = useChatSocket(MY_USER_ID, (msg) => {
    setMessages((prev) => [...prev, msg]);
  });

  // Load chat history on mount
  useEffect(() => {
    fetch(`http://localhost:8087/message/${MY_USER_ID}/${PROVIDER_ID}`)
      .then((res) => res.json())
      .then((data) => setMessages(data));
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage({
      userId: MY_USER_ID,
      providerId: PROVIDER_ID,
      senderId: MY_USER_ID,
      receiverId: PROVIDER_ID,
      content: input.trim(),
    });
    setInput("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", maxWidth: 600, margin: "0 auto" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #eee", fontWeight: 500 }}>
        Chat with Provider {connected ? "🟢" : "🔴"}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.map((msg, i) => (
          <div key={msg.id ?? i} style={{
            alignSelf: msg.senderId === MY_USER_ID ? "flex-end" : "flex-start",
            background: msg.senderId === MY_USER_ID ? "#3B82F6" : "#F3F4F6",
            color: msg.senderId === MY_USER_ID ? "#fff" : "#111",
            padding: "8px 14px",
            borderRadius: 18,
            maxWidth: "70%",
            fontSize: 14,
          }}>
            {msg.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid #eee" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          style={{ flex: 1, padding: "8px 12px", borderRadius: 20, border: "1px solid #ddd", outline: "none" }}
        />
        <button onClick={handleSend} style={{ padding: "8px 18px", borderRadius: 20, background: "#3B82F6", color: "#fff", border: "none", cursor: "pointer" }}>
          Send
        </button>
      </div>
    </div>
  );
}