import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL?.trim();

const Dashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const isPro = user?.subscriptionStatus === "pro";

  const fetchAndUpdate = async () => {
    try {
      const { data } = await axios.get(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      updateUser(data.user);
      return data.user;
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("success")) {
      setMessage("Payment successful! Verifying...");
      setTimeout(() => {
        fetchAndUpdate().then((u) => {
          if (u?.subscriptionStatus === "pro") {
            setMessage("Successfully upgraded to Pro!");
          } else {
            setTimeout(() => {
              fetchAndUpdate().then(() => setMessage("🎉 Successfully upgraded to Pro!"));
            }, 3000);
          }
        });
      }, 3000);
    } else if (params.get("canceled")) {
      setMessage("Payment canceled.");
    } else {
      fetchAndUpdate();
    }
  }, [location.search]);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/create-checkout-session`, {},
        { headers: { Authorization: `Bearer ${user.token}` } });
      window.location.href = data.url;
    } catch (err) {
      setMessage("Something went wrong. Try again.");
    } finally { setLoading(false); }
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel your Pro subscription?")) return;
    try {
      await axios.post(`${API}/api/cancel-subscription`, {},
        { headers: { Authorization: `Bearer ${user.token}` } });
      setMessage("Subscription cancelled.");
      updateUser({ subscriptionStatus: "free" });
    } catch (err) { setMessage("Error cancelling subscription."); }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.logo}>SaaS Chat</h1>
        <button style={styles.logoutBtn} onClick={logout}>Logout</button>
      </div>
      <div style={styles.content}>
        <div style={styles.welcomeCard}>
          <h2>Welcome, {user?.name || user?.email}! 👋</h2>
          <p style={styles.email}>{user?.email}</p>
          <div style={{ ...styles.planBadge, background: isPro ? "#6c63ff" : "#999" }}>
            {isPro ? "Pro Plan" : "Free Plan"}
          </div>
        </div>
        {message && <div style={styles.message}>{message}</div>}
        <div style={styles.plansContainer}>
          <div style={styles.planCard}>
            <h3>Free Plan</h3>
            <p style={styles.price}>$0 / month</p>
            <ul style={styles.features}>
              <li>View chat messages</li>
              <li>Cannot send messages</li>
              <li>Real-time limited</li>
            </ul>
            {!isPro && <div style={styles.currentPlan}>Current Plan</div>}
          </div>
          <div style={{ ...styles.planCard, border: "2px solid #6c63ff" }}>
            <h3 style={{ color: "#6c63ff" }}>Pro Plan ⭐</h3>
            <p style={styles.price}>$9 / month</p>
            <ul style={styles.features}>
              <li>View chat messages</li>
              <li>Send messages in real-time</li>
              <li>Full chat access</li>
            </ul>
            {isPro ? (
              <button style={styles.cancelBtn} onClick={handleCancel}>Cancel Subscription</button>
            ) : (
              <button style={styles.upgradeBtn} onClick={handleUpgrade} disabled={loading}>
                {loading ? "Redirecting..." : "Upgrade to Pro"}
              </button>
            )}
          </div>
        </div>
        <button style={styles.chatBtn} onClick={() => navigate("/chat")}>
          Go to Chat Room →
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: "100vh", background: "#f0f2f5" },
  header: { background: "#fff", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
  logo: { margin: 0, color: "#6c63ff" },
  logoutBtn: { padding: "8px 16px", background: "#ff4757", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" },
  content: { maxWidth: "800px", margin: "40px auto", padding: "0 16px" },
  welcomeCard: { background: "#fff", padding: "24px", borderRadius: "12px", marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", textAlign: "center" },
  email: { color: "#666", margin: "4px 0 12px" },
  planBadge: { display: "inline-block", padding: "6px 16px", borderRadius: "20px", color: "#fff", fontSize: "14px", fontWeight: "bold" },
  message: { background: "#e8f4fd", padding: "12px 16px", borderRadius: "8px", marginBottom: "24px", color: "#333" },
  plansContainer: { display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" },
  planCard: { flex: 1, minWidth: "250px", background: "#fff", padding: "24px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", border: "2px solid transparent" },
  price: { fontSize: "24px", fontWeight: "bold", color: "#333" },
  features: { paddingLeft: "16px", color: "#555", lineHeight: "2" },
  upgradeBtn: { width: "100%", padding: "12px", background: "#6c63ff", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px", marginTop: "16px" },
  cancelBtn: { width: "100%", padding: "12px", background: "#ff4757", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px", marginTop: "16px" },
  currentPlan: { textAlign: "center", padding: "12px", color: "#999", marginTop: "16px" },
  chatBtn: { width: "100%", padding: "16px", background: "#2ed573", color: "#fff", border: "none", borderRadius: "12px", cursor: "pointer", fontSize: "18px", fontWeight: "bold" },
};

export default Dashboard;