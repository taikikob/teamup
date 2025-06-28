import {Link} from "react-router-dom";
import "../css/Navbar.css";
import { useUser } from "../contexts/UserContext";

function Navbar() {
    // do a condition to check if user is logged in
    // if not logged in, show login and sign up links
    // if logged in, show what I current have now
    
    const {user} = useUser();

    const handleLogout = async () => {
        try {
            const response = await fetch("http://localhost:3000/api/auth/logout", {
                credentials: 'include'
            });
            console.log(response);
            window.location.href = "/";
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
            {user ? (
                <div className="navbar-links">
                    <Link to="/home" className="nav-link">Home</Link>
                    <Link to="/inbox" className="nav-link">Inbox</Link>
                    <Link to="/profile" className="nav-link">Profile</Link>
                    <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </div>
            ) : (
                <div className="navbar-links">
                    <Link to="/login" className="nav-link">Login</Link>
                    <Link to="/signup" className="nav-link">Sign Up</Link>
                </div>
            )}
        </nav> 
    )
}
export default Navbar;