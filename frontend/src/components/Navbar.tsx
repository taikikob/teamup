import { Link, useNavigate } from "react-router-dom";
import "../css/Navbar.css";
import { useUser } from "../contexts/UserContext";
import { useNotifications } from "../contexts/NotificationContext";
import { useState, useRef, useEffect } from "react";

function Navbar() {
    const { user, refreshUser, isLoadingUser } = useUser();
    const { unreadCount } = useNotifications();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        if (showDropdown) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showDropdown]);

    const handleLogout = async () => {
        try {
            const response = await fetch("http://localhost:3000/api/auth/logout", {
                credentials: 'include'
            });
            if (response.ok) {
                await refreshUser();
                navigate("/");
            } else {
                const errorData = await response.json();
                console.error("Logout failed:", errorData.message || "Unknown error");
            }
        } catch (error) {
            console.log(error)
        }
    }

    // Only show navbar if user is logged in (and not loading)
    if (isLoadingUser || !user) {
        return null;
    }

    return (
        <nav className="navbar">
            <div className="navbar-title">
                <Link to="/home">
                    <img src="/virTrainLogo.png" alt="VirTrain Logo"/>
                </Link>
            </div>
            <div className="navbar-links">
                <Link to="/home" className="nav-link">Home</Link>
                <Link to="/inbox" className="nav-link">
                    Inbox
                    {unreadCount > 0 && (
                        <span className="notif-badge">{unreadCount}</span>
                    )}
                </Link>
                <div className="nav-link profile-link" style={{ position: "relative" }}>
                    <img
                        className="profile-icon"
                        src={user.profile_picture_link || "/default_pp.png"}
                        alt="Profile"
                        onClick={e => {
                            e.preventDefault();
                            setShowDropdown((prev) => !prev);
                        }}
                        style={{ cursor: "pointer" }}
                    />
                    {showDropdown && (
                        <div className="profile-dropdown" ref={dropdownRef}>
                            <Link to="/profile" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                                Profile
                            </Link>
                            <Link to="/settings" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                                Settings
                            </Link>
                            <button className="dropdown-item" onClick={() => { setShowDropdown(false); handleLogout(); }}>
                                Log out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;