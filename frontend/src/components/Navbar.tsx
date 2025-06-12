import {Link} from "react-router-dom";
import "../css/Navbar.css";

function Navbar() {
    // do a condition to check if user is logged in
    // if not logged in, show login and sign up links
    // if logged in, show what I current have now
  return <nav className="navbar">
        <div className="navbar-title">
            <Link to="/">
                <img src="/virTrainLogo.png" alt="VirTrain Logo"/>
            </Link>
        </div>
        <div className="navbar-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/profile" className="navlink">Profile</Link>
        </div>
    </nav>
}
export default Navbar;