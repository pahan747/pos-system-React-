import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const LoginPage = () => {
  const [email, setEmail] = useState("serendib@gmail.com");
  const [password, setPassword] = useState("Anubaba@123");
  const { login, error, loading } = useContext(AuthContext);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const success = await login(email, password); // Call login function from context
    if (success) {
      navigate("/"); // Redirect to home page if login is successful
      alert("Login successful!");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          style={styles.logo}
          width="56"
          height="84"
          viewBox="77.7 214.9 274.7 412"
        >
          <defs>
            <linearGradient id="a" x1="0%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#8ceabb" />
              <stop offset="100%" stopColor="#378f7b" />
            </linearGradient>
          </defs>
          <path
            fill="url(#a)"
            d="M215 214.9c-83.6 123.5-137.3 200.8-137.3 275.9 0 75.2 61.4 136.1 137.3 136.1s137.3-60.9 137.3-136.1c0-75.1-53.7-152.4-137.3-275.9z"
          />
        </svg>

        <h2 style={styles.title}>Sign In</h2>
        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter Email or Username"
              style={styles.input}
              required
            />
          </div>
          <div style={styles.inputGroup}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Password"
              style={styles.input}
              required
            />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <div style={styles.inputGroup}>
            <button
              type="submit"
              style={styles.button}
              className="bg-blue-500 text-white py-2 px-4 rounded"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>

        <p style={styles.divider}>
          --------------------------------------------
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "linear-gradient(135deg, #12ea00 0%, #2e7d32 100%)",
    color: "#354152",
    fontFamily: "'Helvetica Neue', sans-serif",
    margin: 0,
    padding: 0,
  },
  card: {
    textAlign: "center",
    boxShadow: "0 15px 30px rgba(0, 0, 0, 0.15)",
    padding: "4rem 2rem",
    borderRadius: "20px",
    backgroundColor: "#ffffff",
    position: "relative",
    overflow: "hidden",
    width: "450px",
  },
  logo: {
    marginBottom: "2rem",
    height: "auto",
    maxWidth: "100%",
  },
  title: {
    fontSize: "2.75rem",
    fontWeight: 700,
    margin: "0 0 1rem",
    textTransform: "uppercase",
    color: "#354152",
    textShadow: "1px 1px 2px rgba(0, 0, 0, 0.1)",
  },
  form: {
    margin: 0,
    padding: 0,
  },
  inputGroup: {
    marginBottom: "1rem",
  },
  input: {
    border: "2px solid #8ceabb",
    borderRadius: "999px",
    padding: ".5rem 1rem",
    outline: 0,
    width: "100%",
    backgroundColor: "#f9f9f9",
    textAlign: "center",
    font: "inherit",
    transition: "border 0.3s",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
  },
  button: {
    backgroundImage: "linear-gradient(160deg, #8ceabb 0%, #378f7b 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "999px",
    padding: ".5rem 1rem",
    outline: 0,
    width: "100%",
    cursor: "pointer",
    transition: "transform 0.3s, background 0.3s",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
  },
  divider: {
    marginTop: "1rem",
    color: "#378f7b",
  },
  error: {
    color: "red",
    marginBottom: "1rem",
  },
};

export default LoginPage;
