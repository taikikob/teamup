import {Link} from "react-router-dom";
import "../css/Navbar.css";

function Navbar() {
    // do a condition to check if user is logged in
    // if not logged in, show login and sign up links
    // if logged in, show what I current have now

    type User = {
        name: string;
        email: string;
    };
    
    // const user = null;
    const user: User = {
        name: "John Doe",
        email: "johndoe@gmail.com"
    }

  return (
    <>
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
                    <Link to="/" className="nav-link">Home</Link>
                    <Link to="/profile" className="navlink">Profile</Link>
                </div>
            ) : (
                <div className="navbar-links">
                    <Link to="/login" className="nav-link">Login</Link>
                    <Link to="/signup" className="nav-link">Sign Up</Link>
                </div>
            )}
        </nav> 
    </>
  )
}
export default Navbar;