import { useEffect, useState } from "react";
import { useUser } from "../contexts/UserContext";
import { toast } from "react-toastify";

function Settings() {
    const { user, isLoadingUser, refreshUser } = useUser();
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setNotificationsEnabled(!!user.notifications_enabled);
        }
    }, [user]);

    if (isLoadingUser) {
        return (
            <div style={styles.container}>
                <p>Loading settings...</p>
            </div>
        );
    }

    const handleNotificationChange = async () => {
        setLoading(true);
        console.log("Saving notification setting:", notificationsEnabled);
        try {
            await fetch("http://localhost:3000/api/notif", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ notifications_enabled: notificationsEnabled }),
            });
            refreshUser?.();
        } catch (err) {
            // Optionally show error
        }
        setLoading(false);
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
        setDeleteLoading(true);
        try {
            await fetch("http://localhost:3000/api/auth/delete", {
                method: "DELETE",
                credentials: "include",
            });
            toast.success("Successfully deleted user.", { position: "top-center" });
            setTimeout(() => {
                window.location.href = "/signup";
            }, 1500); // 1.5 seconds delay
        } catch (err) {
            // Optionally show error
        }
        setDeleteLoading(false);
    };

    return (
        <div style={styles.container}>
            <h2>Settings</h2>
            <div style={styles.section}>
                <label style={styles.label}>
                    <input
                        type="checkbox"
                        checked={notificationsEnabled}
                        onChange={e => setNotificationsEnabled(e.target.checked)}
                        disabled={loading}
                        style={{ marginRight: 8 }}
                    />
                    Receive notifications by email
                </label>
                <button
                    style={{
                        ...styles.button,
                        marginLeft: 16,
                        cursor: loading ? "not-allowed" : "pointer",
                        opacity: loading ? 0.7 : 1
                    }}
                    onClick={handleNotificationChange}
                    disabled={loading}
                >
                    {loading ? "Saving..." : "Save"}
                </button>
            </div>
            <div style={styles.section}>
                <button
                    style={{
                        ...styles.button,
                        background: "#dc3545",
                        cursor: deleteLoading ? "not-allowed" : "pointer",
                        opacity: deleteLoading ? 0.7 : 1
                    }}
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                >
                    {deleteLoading ? "Deleting..." : "Delete Account"}
                </button>
            </div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        maxWidth: "400px",
        margin: "60px auto",
        padding: "24px",
        background: "#fff",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
        fontFamily: "sans-serif",
        textAlign: "center"
    },
    section: {
        margin: "24px 0"
    },
    label: {
        fontWeight: 500,
        color: "#333",
        fontSize: "1rem"
    },
    button: {
        padding: "10px 20px",
        fontSize: "1rem",
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: 600
    }
};

export default Settings;