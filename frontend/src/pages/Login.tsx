import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useUser } from "../contexts/UserContext";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const location = useLocation();
    const navigate = useNavigate();
    const { refreshUser } = useUser();
    // Create a ref to track if the signup success toast has already been shown
    const signupToastShownRef = useRef(false);

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

    // display sign up toast
    useEffect(() => {
      if (location.state?.signupSuccessMessage && !signupToastShownRef.current) {
        toast.success(location.state.signupSuccessMessage, { position: 'top-center' });
        signupToastShownRef.current = true; // Mark the toast as shown
        // only navigate after showing the message
        navigate(location.pathname, {
            replace: true,
            state: { ...location.state, signupSuccessMessage: undefined }
        });
      }
    }, [location, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Add login logic here
        try {
          const body = {
            email: email,
            password: password
          }
          const response = await fetch("http://localhost:3000/api/auth/login",{
            method: "POST",
            credentials: "include",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(body)
          });
          if (!response.ok) {
            const errorData = await response.json();
            console.error("Login failed:", errorData.error);
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