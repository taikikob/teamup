import RemovePlayerButton from "../../components/RemovePlayerButton";
import { toast } from "react-toastify";
import { useTeam } from "../../contexts/TeamContext";

function TeammatesPage() {
    const { teamInfo, refreshTeamInfo, isLoadingTeam } = useTeam();

    const removePlayer = async (playerId: number) => {
        if (!teamInfo || !teamInfo.team_id) {
            return;
        }
        try {
            const response = await fetch(`http://localhost:3000/api/teams/${teamInfo.team_id}/player/${playerId}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!response.ok) {
                throw new Error("Failed to remove player");
            }
            toast.success("Player removed successfully", { position: "top-center" });
        } catch (error) {
            console.error("Error removing player:", error);
            toast.error("Failed to remove player. Please try again.", { position: "top-center" });
        } finally {
            refreshTeamInfo();
        }
    }

    return (
        <>
            <h1>Teammates</h1>
            <h2>Coaches</h2>
            {isLoadingTeam ? (
                <div>Loading coaches...</div>
            ) : teamInfo?.coaches_info && teamInfo.coaches_info.length > 0 ? (
                <div>
                    <div>
                        {teamInfo.coaches_info.map(coach => (
                            <div key={coach.user_id}>
                                {coach.first_name} {coach.last_name} - {coach.email}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div>No coaches in this team.</div>
            )}

            <h2>Players</h2>
            {isLoadingTeam ? (
                <div>Loading players...</div>
            ) : teamInfo?.players_info && teamInfo.players_info.length > 0 ? (
                <div>
                    <div>
                        {teamInfo.players_info.map(player => (
                            <div key={player.user_id} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                                <span>
                                    {player.first_name} {player.last_name} - {player.email}
                                </span>
                                {teamInfo.is_user_coach && (
                                    <RemovePlayerButton player={player} handleRemove={() => removePlayer(player.user_id)} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div>No players in this team.</div>
            )}
        </>
    )
}

export default TeammatesPage;