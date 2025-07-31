import { useState } from 'react';
import type { User } from '../types/user';

function RemovePlayerButton({ player, handleRemove }: { player: User; handleRemove: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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
          Remove
        </button>

      {isOpen && (
        <div style={overlayStyles}>
          <div style={modalStyles}>
            <h2>Remove Player</h2>
            <p>Are you sure you want to remove <br></br><strong>{player.first_name} {player.last_name}</strong>?</p>
            <p>Removing this player will delete all data associated with them.</p>
            <button 
              onClick={async e => {
                setLoading(true);
                e.stopPropagation();
                await handleRemove();
                setLoading(false);
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
              {loading ? 'Removing...' : 'Remove Player'}
            </button>
            <br/>
            <button onClick={e => {
              e.stopPropagation();
              handleClose();
            }}>Cancel</button>
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

export default RemovePlayerButton;