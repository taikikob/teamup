import { NavLink, useParams } from 'react-router-dom';
import { useTeam } from '../contexts/TeamContext'; // Import your TeamContext
import '../css/TeamNav.css';



function TeamNav() {
    const { team_id } = useParams();
    const { teamInfo, isLoadingTeam, teamError, refreshTeamInfo} = useTeam(); // Consume the context
  return (
      <div className='team-nav'>
        <div>{teamInfo?.team_name}</div>
        <ul>
          <li>
            <NavLink to={`/teams/${team_id}`} end className={({ isActive }) => isActive ? "active" : ""}>Home</NavLink>
          </li>
          <li>
            <NavLink to={`/teams/${team_id}/mastery`} className={({ isActive }) => isActive ? "active" : ""}>Mastery</NavLink>
          </li>
          <li>
            <NavLink to={`/teams/${team_id}/teammates`} className={({ isActive }) => isActive ? "active" : ""}>Teammates</NavLink>
          </li>
          <li>
            <NavLink to={`/teams/${team_id}/settings`} className={({ isActive }) => isActive ? "active" : ""}>Settings</NavLink>
          </li>
        </ul>
      </div>
  );
}

export default TeamNav;
