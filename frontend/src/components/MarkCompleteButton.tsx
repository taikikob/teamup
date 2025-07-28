import { useState } from "react";
import { toast } from "react-toastify";
import { useTeam } from "../contexts/TeamContext";

function MarkCompleteButton({player_id, task_id}: {player_id: number, task_id: string}) {
    const [loading, setLoading] = useState(false);
    const { teamInfo } = useTeam();
    if (!teamInfo || !teamInfo.team_id) {
        toast.error("Team information is not available.", { position: "top-center" });
        return null;
    }
    const handleMarkComplete = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/tasks/${teamInfo.team_id}/${task_id}/complete`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ player_id }),
            });
            if (!response.ok) {
                throw new Error("Failed to mark task as complete");
            }
            const data = await response.json();
            console.log("Task marked as complete:", data);
            toast.success(data.message, { position: "top-center" });
        } catch (error) {
            toast.error("Failed to mark task as complete", { position: "top-center" });
        } finally {
            setLoading(false);
        }
    }
    
    return (
        <button onClick={handleMarkComplete} disabled={loading}>
            {loading ? "Marking..." : "Mark Complete"}
        </button>
    )
}

export default MarkCompleteButton;