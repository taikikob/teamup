import {Link, useNavigate} from "react-router-dom";
import "../css/Navbar.css";
import { useUser } from "../contexts/UserContext";

function Navbar() {
    // do a condition to check if user is logged in
    // if not logged in, show login and sign up links
    // if logged in, show what I current have now
    
    const {user, refreshUser, isLoadingUser} = useUser();
    const navigate = useNavigate();

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
                        <Link to="/inbox" className="nav-link">Inbox</Link>
                        <Link to="/profile" className="nav-link">Profile</Link>
                        <button className="logout-btn" onClick={handleLogout}>Logout</button>
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