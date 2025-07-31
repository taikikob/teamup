import { NavLink, useParams } from 'react-router-dom';

function TeamNav() {
    const { team_id } = useParams();
  return (
    <>
      <nav style={{ width: '200px', padding: '1rem', borderRight: '1px solid #ccc' }}>
        <ul style={{ listStyle: 'none', padding: 0 }}>
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
      </nav>
    </>
  );
}

export default TeamNav;
