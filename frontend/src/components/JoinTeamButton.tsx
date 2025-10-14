import { useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import '../css/JoinTeamButton.css'

function JoinTeamButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoin = async () => {
    try {
      // send post request to my backend
      setLoading(true);
      const res = await fetch('http://localhost:3000/api/teams/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({input_code_raw: inputCode}),
      });
      
      // retrieve message
      const data = await res.json();
      if (res.status === 201) {
        // close modal
        setIsOpen(false);
        navigate('/home', {state: {
          refresh: true,
          message: data.message
        }
        });
      } else if (res.status === 400) {
        toast.error(data.message, { position: 'top-center' });
        // don't close modal
      } else if (res.status === 500) { // <-- Add this block
        toast.error('A server error occurred. Please try again later.', { position: 'top-center' });
      } else {
        // This is a catch-all for any other unexpected status codes (e.g., 401, 403, etc., if not handled elsewhere)
        // It's good to have a generic fallback.
        toast.error(data.message || `An unexpected error occurred (Status: ${res.status}). Please try again.`, { position: 'top-center' });
      }
    } catch (error) {
      console.error('Error joining team:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleOpen = () => {
    setInputCode('');
    setLoading(false);
    setIsOpen(true);
  };

  const handleClose = () => {
    setInputCode('');
    setLoading(false);
    setIsOpen(false);
  };

  return (
    <div>
      <button className="join-team-button" onClick={handleOpen}>Join Team</button>

      {isOpen && (
        <div style={overlayStyles}>
          <div className="join-team-modal" style={modalStyles}>
            <h2>Join a Team</h2>
            <p>Enter 6 Digit Code:</p>
            <input
              type="text"
              value={inputCode}
              className='text-input'
              onChange={(e) => setInputCode(e.target.value)}
            />
            <button className="join-button" onClick={handleJoin} disabled={loading || inputCode.trim() === ''}>
              {loading ? 'Loading...' : 'Join Team'}
            </button>
            <br/>
            <button className="close-button" onClick={handleClose}>Close</button>
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

export default JoinTeamButton;