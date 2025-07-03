import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function CreateTeamButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [teamName, setTeamName] = useState('');

  const navigate = useNavigate();

  const handleCreate = async () => {
    try {
      // send post request to my backend
      const res = await fetch('http://localhost:3000/api/team/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({team_name: teamName}),
      });

      // check if response was valid
      if (!res.ok) throw new Error('Failed to create team');

      // close modal
      setIsOpen(false);

      // resend user to home page with the state so home page refreshes for user
      navigate('/home', {state: {refresh: true}});
    } catch (error) {
      console.error('Error creating team:', error);
    }
  }

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Create Team</button>

      {isOpen && (
        <div style={overlayStyles}>
          <div style={modalStyles}>
            <h2>Create Team</h2>
            <p>Enter Team Name:</p>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
            <p>By creating the team, you will be the <strong>coach</strong> of the team</p>
            <button onClick={handleCreate}>Create Team</button>
            <br/>
            <button onClick={() => setIsOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

const overlayStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
};

const modalStyles: React.CSSProperties = {
  background: '#fff',
  padding: '2rem',
  borderRadius: '8px'
};

export default CreateTeamButton;