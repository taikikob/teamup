import { useState } from 'react';
import { useTeam } from '../contexts/TeamContext';

function LeaveTeamButton({ teamName, handleLeave }: { teamName: string; handleLeave: () => Promise<void> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { teamInfo } = useTeam(); // Get team info to access coach IDs

  const handleOpen = () => {
    setLoading(false);
    setIsOpen(true);
  };

  const handleClose = () => {
    setLoading(false);
    setIsOpen(false);
  };

  return (
    <div>
      <button
        onClick={e => {
            e.stopPropagation();
            handleOpen();
        }}
        style={{
            background: "#e74c3c",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "8px 16px",
            cursor: "pointer",
            fontWeight: 500
        }}
        >
        Leave Team
      </button>

      {isOpen && (
        <div style={overlayStyles}>
          <div style={modalStyles}>
            <h2>Leave Team</h2>
            <p>Are you sure you want to leave <strong>{teamName}</strong>?</p>
            { teamInfo?.is_user_coach && (
                <p>If you are the only coach in your team, leaving this team will result in the team being deleted</p>
            )}
            { !teamInfo?.is_user_coach && (
              <>
                <p>If you leave this team, you will lose access to all its resources and data. The data associated with you (submissions, comments, progress) will also be deleted.</p>
                <p>You will have to rejoin with an access code.</p>
              </>
            )}
            <p>This action cannot be undone.</p>
            <button 
              onClick={async e => {
                e.stopPropagation();
                setLoading(true);
                try {
                  await handleLeave();
                } finally {
                  setLoading(false);
                }
              }} 
              disabled={loading}
              style={{
                background: "#e74c3c",
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "8px 16px",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 500,
                marginTop: "12px"
              }}
            >
              {loading ? 'Loading...' : 'Leave Team'}
            </button>
            <br/>
            <button onClick={e => {
              e.stopPropagation();
              handleClose();
            }}>Close</button>
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

export default LeaveTeamButton;