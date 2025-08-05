import { useState } from 'react';

function DeleteTeamButton({ teamName, handleDelete }: { teamName: string; handleDelete: () => void }) {
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
        Delete Team
      </button>

      {isOpen && (
        <div style={overlayStyles}>
          <div style={modalStyles}>
            <h2>Delete Team</h2>
            <p>Are you sure you want to delete <strong>{teamName}</strong>?</p>
            <p>Deleting this team will remove all data (media submitted from players, player progress, etc.) associated with it.</p>
            <p>This action cannot be undone.</p>
            <button 
              onClick={async e => {
                e.stopPropagation();
                setLoading(true);
                await handleDelete();
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
              {loading ? 'Loading...' : 'Delete Team'}
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

export default DeleteTeamButton;