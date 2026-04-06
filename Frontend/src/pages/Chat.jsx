import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL?.trim();
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL?.trim();

const Chat = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);

  const isPro = user?.subscriptionStatus === "pro";
  const myId = String(user?.id || user?._id || "");

  useEffect(() => {
    loadMessages();
    const s = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    setSocket(s);
    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    s.on("receive_message", (msg) => setMessages((prev) => [...prev, msg]));
    s.on("new_message", (msg) => setMessages((prev) => [...prev, msg]));
    return () => s.disconnect();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const { data } = await axios.get(`${API}/api/messages`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setMessages(data);
    } catch (err) { console.error("Failed to load messages", err); }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !isPro || !socket) return;
    socket.emit("send_message", { userId: myId, message: newMessage.trim() });
    setNewMessage("");
  };

  const getText = (msg) => msg.message || msg.content || "";
  const getName = (msg) => msg.userName || msg.senderName || "Unknown";
  const getTime = (msg) => msg.timestamp || msg.createdAt || new Date();
  const getSenderId = (msg) => String(msg.userId || msg.sender || "");

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>← Back</button>
          <h2 style={styles.title}>Global Chat</h2>
          <span style={{ ...styles.dot, background: connected ? "#2ed573" : "#ff4757" }} />
        </div>
        <div style={styles.headerRight}>
          <span style={{ ...styles.planBadge, background: isPro ? "#6c63ff" : "#999" }}>
            {isPro ? "⭐ Pro" : "Free"}
          </span>
          <button style={styles.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </div>

      <div style={styles.messagesContainer}>
        {messages.length === 0 && <div style={styles.noMessages}>No messages yet 👋</div>}
        {messages.map((msg, index) => {
          const isMe = getSenderId(msg) === myId;
          return (
            <div key={msg._id || index} style={{
              ...styles.message,
              alignSelf: isMe ? "flex-end" : "flex-start",
              background: isMe ? "#6c63ff" : "#fff",
              color: isMe ? "#fff" : "#333",
            }}>
              <div style={styles.senderName}>{getName(msg)}</div>
              <div>{getText(msg)}</div>
              <div style={styles.time}>
                {new Date(getTime(msg)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {!isPro && (
        <div style={styles.upgradeBanner}>
          You are on Free plan —{" "}
          <span style={styles.upgradeLink} onClick={() => navigate("/dashboard")}>Upgrade to Pro</span>
          {" "}to send messages
        </div>
      )}

      <div style={styles.inputContainer}>
        <input style={{ ...styles.input, opacity: isPro ? 1 : 0.5 }}
          type="text"
          placeholder={isPro ? "Type a message..." : "Upgrade to Pro to send messages"}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          disabled={!isPro} />
        <button style={{ ...styles.sendBtn, opacity: isPro ? 1 : 0.5 }}
          onClick={sendMessage} disabled={!isPro}>Send</button>
      </div>
    </div>
  );
};

const styles = {
  container: { height: "100vh", display: "flex", flexDirection: "column", background: "#f0f2f5" },
  header: { background: "#fff", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
  headerLeft: { display: "flex", alignItems: "center", gap: "12px" },
  headerRight: { display: "flex", alignItems: "center", gap: "12px" },
  backBtn: { padding: "6px 12px", background: "#f0f2f5", border: "none", borderRadius: "8px", cursor: "pointer" },
  title: { margin: 0, color: "#1a1a2e" },
  dot: { width: "10px", height: "10px", borderRadius: "50%", display: "inline-block" },
  planBadge: { padding: "4px 12px", borderRadius: "20px", color: "#fff", fontSize: "13px", fontWeight: "bold" },
  logoutBtn: { padding: "6px 12px", background: "#ff4757", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" },
  messagesContainer: { flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "12px" },
  noMessages: { textAlign: "center", color: "#999", marginTop: "40px" },
  message: { maxWidth: "70%", padding: "12px 16px", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" },
  senderName: { fontSize: "12px", fontWeight: "bold", marginBottom: "4px", opacity: 0.8 },
  time: { fontSize: "11px", opacity: 0.6, marginTop: "4px", textAlign: "right" },
  upgradeBanner: { background: "#fff3cd", padding: "12px 24px", textAlign: "center", color: "#856404" },
  upgradeLink: { color: "#6c63ff", cursor: "pointer", fontWeight: "bold", textDecoration: "underline" },
  inputContainer: { background: "#fff", padding: "16px 24px", display: "flex", gap: "12px", boxShadow: "0 -2px 8px rgba(0,0,0,0.1)" },
  input: { flex: 1, padding: "12px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px" },
  sendBtn: { padding: "12px 24px", background: "#6c63ff", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" },
};

export default Chat;