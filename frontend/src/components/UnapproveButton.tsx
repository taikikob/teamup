import { useState } from "react";
import { toast } from "react-toastify";
import type { PlayerSubmission } from "../types/playerSubmission";
import { useTeam } from "../contexts/TeamContext";
import { usePlayerSubmissions } from "../contexts/PlayerSubmissionsContext";
import '../css/UnapproveButton.css';

function UnapproveButton({
  player_id,
  task_id,
  setSelectedSubmission,
  setSelected
}: {
  player_id: number,
  task_id: string,
  setSelectedSubmission: React.Dispatch<React.SetStateAction<PlayerSubmission | null>>,
  setSelected: React.Dispatch<React.SetStateAction<boolean>>
}) {
    const { updatePlayerSubmission } = usePlayerSubmissions();
    const [loading, setLoading] = useState(false);
    const { teamInfo } = useTeam();
    if (!teamInfo || !teamInfo.team_id) {
        toast.error("Team information is not available.", { position: "top-center" });
        return null;
    }
    const handleUnapproveSubmission = async () => {
        try {
            setLoading(true);
            console.log("Unapproving task for player:", player_id, "task:", task_id, "team:", teamInfo.team_id);
            const response = await fetch(`https://teamup-five.vercel.app/api/tasks/${teamInfo.team_id}/${task_id}/unapprove`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ player_id }),
                credentials: "include"
            });
            if (!response.ok) {
                throw new Error("Failed to mark task as complete");
            }
            const data = await response.json();
            console.log("Returned submission for player to submit retry:", data);
            toast.success(data.message, { position: "top-center" });
            // Fetch the updated submission from my backend
            const updatedRes = await fetch(`https://teamup-five.vercel.app/api/posts/playerSubmission/${teamInfo.team_id}/${task_id}/${player_id}`, {
                credentials: 'include'
            });
            if (updatedRes.ok) {
                const updatedSubmission = await updatedRes.json();
                updatePlayerSubmission(updatedSubmission);
            }
        } catch (error) {
            toast.error("Failed to return submission for player", { position: "top-center" });
        } finally {
            setLoading(false);
            setSelectedSubmission(null);
            setSelected(false);
        }
    }
    
    return (
        <button
          className="unapprove-btn"
          onClick={handleUnapproveSubmission}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? "Returning Submission..." : "Send Back for Revision"}
        </button>
    )
}

export default UnapproveButton;