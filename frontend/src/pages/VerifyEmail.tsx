import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";

function VerifyEmail() {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const navigate = useNavigate();
    const location = useLocation();

    // Access state passed from navigate
    const { email, username } = location.state || {};

    // Redirect to signup if email or username is missing
    useEffect(() => {
        if (!email || !username) {
            toast.error("Took too long to verify, or page was refreshed. Please sign up again.", { position: "top-center" });
            navigate('/signup');
        }
    }, [email, username, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const trimmedCode = code.trim();
            const response = await fetch("https://teamup-five.vercel.app/api/auth/verify-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: trimmedCode }),
                credentials: "include"
            });
            const data = await response.json();
            if (response.ok) {
                toast.success(data.message, { position: "top-center" });
                navigate('/login');
            } else {
                toast.error(data.message || "Verification failed. Please try again.", { position: "top-center" });
            }
        } catch (err) {
            toast.error("An error occurred. Please try again.", { position: "top-center" });
        }
        setLoading(false);
    };

    const resendCode = async () => {
        try {
            const response = await fetch("https://teamup-five.vercel.app/api/auth/resend-verification-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, username }),
                credentials: "include"
            });
            const data = await response.json();
            if (response.ok) {
                setMessage("Verification code resent. Please check your email.");
            } else {
                toast.error(data.message || "Failed to resend verification email. Please try again.", { position: "top-center" });
            }
        } catch (error) {
            toast.error("An error occurred while resending the verification email.", { position: "top-center" });
        }
    }

    

    return (
        <div style={{ maxWidth: 500, margin: "60px auto", padding: 24, textAlign: "center", background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
            <h1>Verify Your Email</h1>
            <p>{username}, please enter the verification code sent to <strong>{email}</strong>.</p>
            <p><strong>Note:</strong> Check your spam folder if you don't see the email.</p>
            <p>You have 15 minutes to enter the code</p>
            <p>Do not refresh the page, or you will have to sign up again</p>
            <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
                <input
                    type="text"
                    placeholder="Enter verification code"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    style={{ padding: 10, fontSize: "1rem", width: "100%", marginBottom: 16, borderRadius: 4, border: "1px solid #ccc" }}
                    required
                />
                <button
                    type="submit"
                    disabled={loading || !code}
                    style={{
                        padding: 10,
                        width: "100%",
                        background: "#28a745",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        fontWeight: 600,
                        cursor: loading ? "not-allowed" : "pointer"
                    }}
                >
                    {loading ? "Verifying..." : "Verify Email"}
                </button>
            </form>
            <p style={{ marginTop: 32, color: "#555" }}>
                Didn't receive an email? <a href="#" onClick={e => { e.preventDefault(); resendCode(); }}>Resend verification code</a>
            </p>
            {message && <p style={{ color: "green" }}>{message}</p>}
        </div>
    );
}

export default VerifyEmail;