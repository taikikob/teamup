import type { Team } from "../types/team";
import "../css/TeamCard.css";

interface TeamCardProps {
    team: Team
}

function TeamCard({team}:TeamCardProps) {
    return (
        <div className="team-card">
            <div>{team.team_name}</div>
            <div>Role: {team.role}</div>
        </div>
    )
}

export default TeamCard;