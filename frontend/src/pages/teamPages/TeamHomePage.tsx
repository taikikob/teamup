import { useRef, useState } from "react";
import EditDescriptionButton from "../../components/EditDescriptionButton";
import { useTeam } from "../../contexts/TeamContext";
import { toast } from 'react-toastify';

function TeamHomePage() {
    // coach should be able to view the access codes
    const { teamInfo, isLoadingTeam, teamError, refreshTeamInfo} = useTeam(); // Consume the context

    const [loadingButton, setLoadingButton] = useState(false);
    const [addingMedia, setAddingMedia] = useState(false);
    const [teamImg, setTeamImg] = useState<File | null>(null);
    const teamImgInputRef = useRef<HTMLInputElement>(null); 
    // conditional rendering

    if (isLoadingTeam) {
        return <div className="team-loading">Loading team information...</div>;
    }

    if (teamError) {
        return <div className="team-error">Error: {teamError}</div>;
    }

    if (!teamInfo) {
        return <div className="team-not-found">Team not found or no information available.</div>;
    }

    const coachAccessCode = (teamInfo.team_access_codes ?? []).find(code => code.role === 'Coach');
    const playerAccessCode = (teamInfo.team_access_codes ?? []).find(code => code.role === 'Player');

    const generateNewAccessCodes = async () => {
        setLoadingButton(true);
        try {
            const res = await fetch(`http://localhost:3000/api/teams/${teamInfo.team_id}/newAccessCode`, {
                method: 'POST',
                credentials: 'include'
            });
            const data = await res.json();
            if (res.status === 201) {
                refreshTeamInfo();
                toast.success(data.message, { position: 'top-center' });
            } else {
                toast.error(data.message, { position: 'top-center' });
            }
        } catch (error) {
            console.error('Error creating new access code', error);
        } finally {
            setLoadingButton(false);
        }
    }

    const disableAccessCodes = async () => {
        setLoadingButton(true);
        try {
            const res = await fetch(`http://localhost:3000/api/teams/${teamInfo.team_id}/delAccessCode`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (res.status === 204) {
                refreshTeamInfo();
                toast.success('Successfully removed access codes, no coach/player can join your team', { position: 'top-center' });
            } else {
                const data = await res.json();
                toast.error(data.message, { position: 'top-center' });
            }
        } catch (error) {
            console.error('Error deleting existing access code', error);
        } finally {
            setLoadingButton(false);
        }
    }

    const teamImgSubmit = async (e: React.FormEvent) => {
        setAddingMedia(true);
        e.preventDefault();
        if (!teamInfo) return;
    
        const formData = new FormData();
        if (teamImg) {
            formData.append("media", teamImg);
        }
        const res = await fetch(`http://localhost:3000/api/posts/${teamInfo.team_id}`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        if (!res.ok) {
            const errorData = await res.json();
            console.error("Failed to update team image:", errorData.error); 
            return;
        }
        const data = await res.json();
        if (res.status === 201) {
            // show a success toast notification
            toast.success(data.message, { position: 'top-center' });
        }
        setTeamImg(null);
        if (teamImgInputRef.current) {
            teamImgInputRef.current.value = ""; // <-- Reset the file input
        }
        refreshTeamInfo(); // Refresh team info to get the new image
        setAddingMedia(false);
    }

    return (
        <div className="team-home-page">
            <h1>{teamInfo.team_name}</h1>
            { teamInfo.team_img_url ? (
                <img src={teamInfo.team_img_url} alt="Team Photo" />
            ) : (
                <img src={"/def_team_img.png"} alt="Default Team Photo" style={{ width: "200px" }} />
            )}
            {teamInfo.is_user_coach && 
                <form onSubmit={teamImgSubmit}>
                    <input 
                    ref={teamImgInputRef}
                    onChange={e => {
                        const file = e.target.files && e.target.files[0];
                        // Check file type
                        if (!file) {
                            return;
                        }
                        if (!file.type.startsWith("image/")) {
                            toast.error("Please select a valid image file.", { position: "top-center" });
                            setTeamImg(null);
                            if (teamImgInputRef.current) teamImgInputRef.current.value = "";
                            return;
                        }
                        // Reject SVGs
                        if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
                            toast.error("SVG images are not allowed. Please select a PNG, JPG, or GIF.", { position: "top-center" });
                            setTeamImg(null);
                            if (teamImgInputRef.current) teamImgInputRef.current.value = "";
                            return;
                        }
                        setTeamImg(file);
                    }}
                    type="file" 
                    accept="image/*"
                    />
                    <button type="submit" disabled={addingMedia || !teamImg}>
                        {addingMedia ? "Posting..." : "Upload New Team Image"}
                    </button>
                </form>
            }
            <div>
                <strong>Team Description:</strong> {teamInfo.team_description || 'No description provided.'}
                {/* TODO: Add description if no description, edit description if one exists */}
                {teamInfo.is_user_coach && (
                    <EditDescriptionButton/>
                )}
            </div>
            {/* Coach if only 1 coach, coaches if more than 1 coach */}
            <h2>
                {teamInfo.coaches_info && teamInfo.coaches_info.length === 1 ? "Coach:" : "Coaches:"}
            </h2>
            {teamInfo.coaches_info && teamInfo.coaches_info.length > 0 ? (
                <div>
                    {teamInfo.coaches_info.map((coach) => (
                        <div key={coach.user_id}>
                            {coach.first_name} {coach.last_name} ({coach.email})
                        </div>
                    ))}
                </div>
            ) : (
                <p>No coaches listed for this team.</p>
            )}
            {/* Display Access Codes ONLY IF the current user is a coach */}
            {teamInfo.is_user_coach && (
                <div>
                    <h2>Access Codes: (Can Only Be Seen By Coaches)</h2>
                    <p>
                        <strong>Coach Access Code:</strong>{" "}
                        {coachAccessCode ? ( // <-- Ternary operator for inner condition
                            <>
                                {coachAccessCode.code} (Expires: {new Date(coachAccessCode.expires_at).toLocaleDateString()})
                            </>
                        ) : (
                            "N/A"
                        )}
                    </p>
                    <p>
                        <strong>Player Access Code:</strong>{" "}
                        {playerAccessCode ? ( // <-- Ternary operator for inner condition
                            <>
                                {playerAccessCode.code} (Expires: {new Date(playerAccessCode.expires_at).toLocaleDateString()})
                            </>
                        ) : (
                            "N/A"
                        )}
                    </p>
                    {loadingButton ? (<button>Loading...</button>):(<button onClick={generateNewAccessCodes}>Generate New Access Codes</button>)}
                    {loadingButton ? (<button>Loading...</button>):(<button onClick={disableAccessCodes}>Disable Access Codes</button>)}
                </div>
            )}
        </div>
    )
}

export default TeamHomePage;