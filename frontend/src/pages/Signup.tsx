import React, { useState } from "react";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Add sign-up logic here
    try {
      const body = {
        email: email,
        password: password
      }
      const response = await fetch("http://localhost:5001/signup",{
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Signup failed:", errorData.error);
        // optionally set error state here to show in UI
        return;
      }
    } catch (error) {
      
    }
  };

  const handleGoogleSignup = () => {
    // TODO: Add Google sign-up logic here
  };

  return (
    <div style={styles.container}>
      <h2>Sign Up</h2>
      <form onSubmit={handleSignup} style={styles.form}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={handleEmailChange}
          style={styles.input}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={handlePasswordChange}
          style={styles.input}
          required
        />
        <button type="submit" style={styles.button}>
          Sign Up
        </button>
      </form>
      <div style={styles.divider}>or</div>
      <button onClick={handleGoogleSignup} style={styles.googleButton}>
        Sign Up with Google
      </button>
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
  input: {
    padding: "10px",
    fontSize: "1rem",
    border: "1px solid #ccc",
    borderRadius: "4px",
  },
  button: {
    padding: "10px",
    fontSize: "1rem",
    backgroundColor: "#28a745",
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
  },
};

export default Signup;