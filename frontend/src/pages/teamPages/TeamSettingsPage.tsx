import { useEffect, useState } from "react";
import { useTeam } from "../../contexts/TeamContext";
import { toast } from "react-toastify";
import DeleteTeamButton from "../../components/DeleteTeamButton";
import LeaveTeamButton from "../../components/LeaveTeamButton";

function TeamSettingsPage() {
    // Create updateTeamName function in TeamContext
    const { teamInfo, updateTeamName, leaveTeam, deleteTeam } = useTeam();
    const [teamName, setTeamName] = useState<string>(teamInfo?.team_name || "");
    const [loading, setLoading] = useState<boolean>(false);

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

    useEffect(() => {
        if (teamInfo?.team_name) {
            setTeamName(teamInfo.team_name);
        }
    }, [teamInfo?.team_name]);

    if (!teamInfo) {
        return <div>Loading team information...</div>;
    }

    return (
        <>
            <h1>Team Settings</h1>
            { teamInfo?.is_user_coach && (
                <div>
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
        </>
    );
}

export default TeamSettingsPage;