import { useRef, useEffect, useState } from "react";
import { useTeam } from "../../contexts/TeamContext";
import { toast } from "react-toastify";
import DeleteTeamButton from "../../components/DeleteTeamButton";
import LeaveTeamButton from "../../components/LeaveTeamButton";
import "../../css/TeamSettingsPage.css"

function TeamSettingsPage() {
    // Create updateTeamName function in TeamContext
    const { teamInfo, updateTeamName, leaveTeam, deleteTeam, refreshTeamInfo } = useTeam();
    const [teamName, setTeamName] = useState<string>(teamInfo?.team_name || "");
    const [loading, setLoading] = useState<boolean>(false);
    const [addingMedia, setAddingMedia] = useState(false);
    const [teamImg, setTeamImg] = useState<File | null>(null);
    const teamImgInputRef = useRef<HTMLInputElement>(null); 

    const handleChangeTeamName = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateTeamName(teamName);
        } catch (error) {
            console.error("Failed to update team name:", error);
            toast.error("Failed to update team name.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTeam = async () => {
        // Implement delete team functionality
        if (!teamInfo || !teamInfo.team_id) {
            return;
        }
        try {
            await deleteTeam();
        } catch (error) {
            console.error("Failed to delete team:", error);
            toast.error("Failed to delete team. Please try again.");
        }
    }

    const handleLeaveTeam = async () => {
        // Implement leave team functionality
        if (!teamInfo || !teamInfo.team_id) {
            return;
        }
        try {
            await leaveTeam();
        } catch (error) {
            console.error("Failed to leave team:", error);
            toast.error("Failed to leave team. Please try again.");
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
        const res = await fetch(`https://teamup-five.vercel.app/api/posts/${teamInfo.team_id}`, {
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

    useEffect(() => {
        if (teamInfo?.team_name) {
            setTeamName(teamInfo.team_name);
        }
    }, [teamInfo?.team_name]);

    if (!teamInfo) {
        return <div>Loading team information...</div>;
    }

    return (
        <div className="team-settings-page">
            <h1>Team Settings</h1>
            { teamInfo?.is_user_coach && (
                <div className="coach-settings">
                    <h2>Coach Settings</h2>
                    <div>
                        <h2>Change Team Name</h2>
                        <form onSubmit={handleChangeTeamName} style={{ maxWidth: 400 }}>
                            <input
                                type="text"
                                value={teamName}
                                onChange={e => setTeamName(e.target.value)}
                                disabled={loading}
                                style={{ width: "100%", marginBottom: 8 }}
                            />
                            <button
                                type="submit"
                                disabled={
                                    loading ||
                                    !teamName.trim() ||
                                    teamName.trim() === (teamInfo?.team_name?.trim() || "")
                                }
                            >
                                {loading ? "Saving..." : "Save"}
                            </button>
                        </form>
                    </div>
                    <div className="team-photo-change">
                        <h2>Change Team Photo</h2>
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
                    </div>
                    <div>
                        <h2>Delete Team</h2>
                        <p>Once you delete a team, there is no going back. Please be certain.</p>
                        {/** TODO: Implement delete team functionality */}
                        <DeleteTeamButton
                            teamName={teamInfo.team_name}
                            handleDelete={handleDeleteTeam}
                        />
                    </div>
                </div>
            )}
            <div>
                <h2>Leave Team</h2>
                <p>This action cannot be undone.</p>
                <LeaveTeamButton
                    teamName={teamInfo.team_name}
                    handleLeave={handleLeaveTeam}
                />
            </div>
        </div>
    );
}

export default TeamSettingsPage;