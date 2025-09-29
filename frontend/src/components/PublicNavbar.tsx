import { Link } from "react-router-dom";
import "../css/Navbar.css";

function PublicNavbar() {
    return (
        <nav className="navbar">
            <div className="navbar-title">
                <Link to="/">
                    <img src="/virTrainLogo.png" alt="VirTrain Logo"/>
                </Link>
            </div>
            <div className="navbar-links">
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/signup" className="nav-link">Sign Up</Link>
            </div>
        </nav>
    );
}

export default PublicNavbar;