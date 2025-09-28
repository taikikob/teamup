import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function ForgotPassword() {
    const [step, setStep] = useState<1 | 2>(1);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Step 2 states
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const navigate = useNavigate();

    const handleStep1Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const response = await fetch("http://localhost:3000/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email }),
            });
            const data = await response.json();
            if (response.ok) {
                // If user with the username and email exists, a reset code is sent
                toast.success(data.message, { position: "top-center" });
                setStep(2);
            } else {
                setError(data.message || "Failed to send reset code, please try again later.");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        }
        setLoading(false);
    };

    const handleStep2Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const response = await fetch("http://localhost:3000/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, code: code.trim(), newPassword }),
            });
            const data = await response.json();
            if (response.ok) {
                toast.success(data.message, { position: "top-center" });
                navigate('/login');
            } else {
                setError(data.message || "Failed to reset password.");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        }
        setLoading(false);
    };

    useEffect(() => {
        // Check if passwords match
        if (newPassword && confirmPassword && newPassword !== confirmPassword) {
            setError("Passwords do not match");
        } else {
            setError("");
        }
    }, [newPassword, confirmPassword]);

    return (
        <div style={styles.container}>
            {step === 1 && (
                <>
                    <h1>Forgot Password</h1>
                    <p>Please enter your username and associated email address to reset your password.</p>
                    <form style={styles.form} onSubmit={handleStep1Submit}>
                        <div style={styles.label}>Username</div>
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            style={styles.input}
                            required
                        />
                        <div style={styles.label}>Email</div>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            style={styles.input}
                            required
                        />
                        <button type="submit" style={{ ...styles.button, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1 }} disabled={loading}>
                            {loading ? "Sending..." : "Send Reset Code"}
                        </button>
                    </form>
                    {error && <div style={{ color: "red", marginTop: 16 }}>{error}</div>}
                </>
            )}
            {step === 2 && (
                <>
                    <h1>Reset Password</h1>
                    <p>Enter the code sent to your email and your new password.</p>
                    <form style={styles.form} onSubmit={handleStep2Submit}>
                        <div style={styles.label}>Reset Code</div>
                        <input
                            type="text"
                            placeholder="Reset Code"
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            style={styles.input}
                            required
                        />
                        <div style={styles.label}>New Password</div>
                        <input
                            type="password"
                            placeholder="New Password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            style={styles.input}
                            required
                        />
                        <div style={styles.label}>Confirm New Password</div>
                        <input
                            type="password"
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            style={styles.input}
                            required
                        />
                        <button
                          type="submit"
                          style={{ ...styles.button, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1 }}
                          disabled={
                            loading ||
                            !code ||
                            !newPassword ||
                            !confirmPassword ||
                            newPassword !== confirmPassword
                          }
                        >
                          {loading ? "Resetting..." : "Reset Password"}
                        </button>
                    </form>
                    {error && <div style={{ color: "red", marginTop: 16 }}>{error}</div>}
                </>
            )}
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

export default ForgotPassword;