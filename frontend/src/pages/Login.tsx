import React, { useState } from "react";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Add login logic here
    };

    const handleGoogleLogin = () => {
        // TODO: Add Google login logic here
    };
    
    return ( 
        <div style={styles.container}>
            <h2>Login</h2>
            <form onSubmit={handleLogin} style={styles.form}>
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
                Log In
                </button>
            </form>
            <div style={styles.divider}>or</div>
            <button onClick={handleGoogleLogin} style={styles.googleButton}>
                Login with Google
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
  },
};

export default Login;