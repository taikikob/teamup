import { useState } from "react";
import { useUser } from "../contexts/UserContext";
import "../css/Profile.css";
import ImageCropper from "../components/ImageCropper";

function Profile() {
    const { user, isLoadingUser } = useUser();
    const [showModal, setShowModal] = useState(false);

    if (isLoadingUser) {
        return (
            <div className="profile-container" style={{ textAlign: "center", padding: "2rem" }}>
                <p>Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <div className="profile-left">
                <h1>Profile</h1>
                    <div className="pp-button-container">
                    {user?.profile_picture_link ? (
                        <img
                            src={user.profile_picture_link}
                            alt="Profile Picture"
                            className="profile-picture"
                        />
                    ) : (
                        <img
                            src="/default_pp.svg"
                            alt="Default Profile"
                            className="profile-picture"
                        />
                    )}
                    <button 
                        onClick={() => setShowModal(true)}
                        title="Change Profile Picture"
                    >
                        <img src="/icons8-pencil-50.png" alt="Edit" className="pencil-icon"/>
                    </button>
                </div>
            </div>
            
            {showModal && (
                <div style={{
                    position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
                    background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                    <div style={{ background: "#fff", padding: 24, borderRadius: 8, minHeight: 800 , minWidth: 600, marginTop: 300}}>
                        <ImageCropper onClose={() => setShowModal(false)} />
                    </div>
                </div>
            )}
            <div className="profile-info">
                <p>Username: {user?.username}</p>
                <p>Name: {user?.first_name} {user?.last_name}</p>
                <p>Email: {user?.email}</p>
            </div>
        </div>
    );
}

export default Profile;