import type { Team } from "../types/team";
import "../css/TeamCard.css";

interface TeamCardProps {
    team: Team
}

function TeamCard({team}:TeamCardProps) {
    return (
        <div className="team-card">
            <img src={team.team_img_url || "/def_team_img.png"} alt="Team Photo" />
            <div>{team.team_name}</div>
            <div>Role: {team.role}</div>
        </div>
    )
}

export default TeamCard;