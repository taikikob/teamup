import {Link, useNavigate} from "react-router-dom";
import "../css/Navbar.css";
import { useUser } from "../contexts/UserContext";
import { useNotifications } from "../contexts/NotificationContext";
import { useState, useRef, useEffect } from "react";

function Navbar() {
    const {user, refreshUser, isLoadingUser} = useUser();
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
                // Handle cases where the logout request fails
                const errorData = await response.json();
                console.error("Logout failed:", errorData.message || "Unknown error");
            }
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <nav className="navbar">
            <div className="navbar-title">
                {user ? (
                    <Link to="/home">
                        <img src="/virTrainLogo.png" alt="VirTrain Logo"/>
                    </Link>
                ):(
                    <Link to="/">
                        <img src="/virTrainLogo.png" alt="VirTrain Logo"/>
                    </Link>
                )}
            </div>
            {/* Conditional rendering based on isLoadingUser first */}
            <div className="navbar-links">
                {isLoadingUser ? (
                    // Option 1: Show a simple loading message
                    <span className="nav-loading">Loading...</span> // You can style this or replace with a spinner component
                ) : user ? (
                    // Option 2: User is logged in
                    <>
                        <Link to="/home" className="nav-link">Home</Link>
                        <Link to="/inbox" className="nav-link">
                            Inbox
                            {unreadCount > 0 && (
                                <span className="notif-badge">{unreadCount}</span>
                            )}
                        </Link>
                        <Link to="#" className="nav-link profile-link" style={{ position: "relative" }}>
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
                                    <button className="dropdown-item" onClick={() => { setShowDropdown(false); handleLogout(); }}>
                                        Log out
                                    </button>
                                </div>
                            )}
                        </Link>
                    </>
                ) : (
                    // Option 3: User is not logged in (and loading is complete)
                    <> 
                        <Link to="/login" className="nav-link">Login</Link>
                        <Link to="/signup" className="nav-link">Sign Up</Link>
                    </>
                )}
            </div>
        </nav> 
    )
}

export default Navbar;