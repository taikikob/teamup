import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useUser } from "../contexts/UserContext";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const { refreshUser } = useUser();

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Add login logic here
        try {
          const body = {
            username: username,
            password: password
          }
          const response = await fetch("http://localhost:3000/api/auth/login",{
            method: "POST",
            credentials: "include",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(body)
          });
          if (!response.ok) {
            const data = await response.json();
            console.error("Login failed:", data.message);
            toast.error(`Login failed: ${data.message}, please try again.`, { position: 'top-center' });
            // optionally set error state here to show in UI
            return;
          }
          // **Crucial**: After successful login, tell the UserContext to re-fetch user data
          await refreshUser();
          navigate("/home");
        } catch (error) {
          console.error("Error duing login: ", error);
        }
    };
    
    return ( 
      <div style={styles.container}>
        <h2>Login</h2>
        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.label}>Username</div>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={handleUsernameChange}
            style={styles.input}
            required
          />
          <div style={styles.label}>Password</div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={handlePasswordChange}
            style={styles.input}
            required
          />
          <button type="submit" style={styles.button}>
            Log In
          </button>
        </form>
      </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: "100%",
    maxWidth: "400px",
    margin: "100px auto",
    padding: "20px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
    borderRadius: "8px",
    textAlign: "center",
    fontFamily: "sans-serif",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "15px"
  },
  label: {
    textAlign: "left",
    fontWeight: 500,
    color: "#333",
    marginBottom: "-8px",
    marginTop: "2px"
  },
  input: {
    padding: "10px",
    fontSize: "1rem",
    border: "1px solid #ccc",
    borderRadius: "4px",
  },
  button: {
    padding: "10px",
    fontSize: "1rem",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  googleButton: {
    padding: "10px",
    fontSize: "1rem",
    backgroundColor: "#db4437",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  divider: {
    margin: "20px 0",
    color: "#888",
  }
};

export default Login;