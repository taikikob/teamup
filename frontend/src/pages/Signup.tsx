import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

function Signup() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [verifyingUsername, setVerifyingUsername] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const usernameTimeout = useRef<number | null>(null);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);

    if (usernameTimeout.current) {
      clearTimeout(usernameTimeout.current);
    }

    if (e.target.value) {
      setVerifyingUsername(true); // Start verifying
      usernameTimeout.current = setTimeout(() => {
        checkUsername(e.target.value);
      }, 300);
    } else {
      setVerifyingUsername(false);
      setUsernameError("");
    }
  };

  const checkUsername = async (value: string) => {
    const response = await fetch(`/api/auth/check-username?username=${value}`);
    const data = await response.json();
    setUsernameError(!data.isUnique ? "Username is already taken" : "");
    setVerifyingUsername(false); // Done verifying
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFirstName(e.target.value);
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLastName(e.target.value);
  };

  const handleSignup = async (e: React.FormEvent) => {
    setLoading(true);
    e.preventDefault();
    try {
      const body = {
        username: username,
        password: password,
        email: email,
        firstName: firstName,
        lastName: lastName
      }
      const response = await fetch("/api/auth/signup",{
        method: "POST",
        credentials: "include", // Include cookies for session management
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Signup failed:", errorData.error);
        toast.error(`Signup failed: ${errorData.error}, please try again.`, { position: 'top-center' });
        return;
      }
      const data = await response.json();
      if (response.status === 201) {
        // send user to email verification page
        toast.success(data.message, { position: 'top-center' });
        navigate('/verify-email', { state: { 
          email: email,
          username: username
        } });
      }
      setLoading(false);
    } catch (error) {
      console.error("Error during signup:", error);
    }
  };

  useEffect(() => {
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
    } else {
      setPasswordError("");
    }
  }, [password, confirmPassword]);

  return (
    <div style={styles.container}>
      <form onSubmit={handleSignup} style={styles.form}>
        <div style={styles.title}>Sign Up</div>
        <div style={styles.label}>Username</div>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={handleUsernameChange}
          style={styles.input}
          required
        />
        {verifyingUsername && <div style={{ color: '#888' }}>Verifying...</div>}
        {usernameError && <div style={{ color: 'red' }}>{usernameError}</div>}
        {username && !verifyingUsername && !usernameError && (
          <div style={{ color: 'green' }}>Username is available</div>
        )}
        <div style={styles.label}>Password</div>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={handlePasswordChange}
          style={styles.input}
          required
        />
        <div style={styles.label}>Confirm Password</div>
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={styles.input}
          required
        />
        {passwordError && <div style={{ color: 'red' }}>{passwordError}</div>}
        {password && confirmPassword && !passwordError && (
          <div style={{ color: 'green' }}>Passwords match</div>
        )}
        <div style={styles.label}>Email</div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={handleEmailChange}
          style={styles.input}
          required
        />
        <div style={styles.label}>First Name</div>
        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={handleFirstNameChange}
          style={styles.input}
          required
        />
        <div style={styles.label}>Last Name</div>
        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={handleLastNameChange}
          style={styles.input}
          required
        />
        <button
          type="submit"
          disabled={
            !!passwordError ||
            !!usernameError ||
            verifyingUsername || 
            loading
          }
          style={{
            ...styles.button,
            background: (
              !!passwordError ||
              !!usernameError ||
              verifyingUsername ||
              loading
            )
              ? "#bdbdbd"
              : styles.button.background,
            cursor: (
              !!passwordError ||
              !!usernameError ||
              verifyingUsername ||
              loading
            )
              ? "not-allowed"
              : "pointer"
          }}
          title={
            !!passwordError ||
            !!usernameError ||
            verifyingUsername
              ? "Please fill out all fields correctly"
              : undefined
          }
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>
        <div>
        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
      </form>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: "100vw",
    minHeight: "100vh",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center"
  },
  form: {
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    padding: "32px 28px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    minWidth: "500px",
    maxWidth: "360px",
    margin: "0 auto",
    marginTop: "40px"
  },
  input: {
    padding: "12px",
    fontSize: "1rem",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    background: "#f9fafb",
    outline: "none",
    transition: "border 0.2s",
  },
  button: {
    padding: "12px",
    fontSize: "1rem",
    background: "linear-gradient(90deg, #28a745 60%, #218838 100%)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 600,
    marginTop: "10px",
    transition: "background 0.2s",
  },
  googleButton: {
    padding: "12px",
    fontSize: "1rem",
    background: "#db4437",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginTop: "8px",
  },
  label: {
    textAlign: "left",
    fontWeight: 500,
    color: "#333",
    marginBottom: "-8px",
    marginTop: "2px"
  },
  title: {
    marginBottom: "12px",
    color: "#222",
    fontWeight: 700,
    fontSize: "2rem",
    letterSpacing: "-1px",
    textAlign: "center"
  }
};

export default Signup;