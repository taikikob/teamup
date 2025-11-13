import { useState, useEffect } from 'react';
import { useTeam } from "../contexts/TeamContext";
import { toast } from 'react-toastify';
import "../css/EditDescriptionButton.css";

function EditDescriptionButton() {
  const { teamInfo, refreshTeamInfo } = useTeam(); // Consume the context

  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState(teamInfo?.team_description ?? '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Update description state when teamInfo is loaded or changes
    if (teamInfo) {
      setDescription(teamInfo.team_description ?? '');
    }
  }, [teamInfo]);

  const handleEdit = async () => {

    if (!teamInfo || teamInfo.team_id === undefined || teamInfo.team_id === null) {
      console.log(teamInfo?.team_id);
      console.error('Error: Team information (ID) is not available.');
      // You might want to show a user-friendly error message or alert
      return; // Stop execution
    }
    try {
      // send post request to my backend
      setLoading(true);
      const res = await fetch(`/api/teams/${teamInfo.team_id}/editDescription`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
            team_description: description
        }),
      });

      // check if response was valid
      if (!res.ok) throw new Error('Failed to edit team');
      // retrieve message
      const data = await res.json();
      // TODO: Do something with the message. Show on screen
      toast.success(data.message, { position: 'top-center' }); // <-- Show toast directly
      // close modal
      setIsOpen(false);
      refreshTeamInfo();
    } catch (error) {
      console.error('Error creating team:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleOpen = () => {
    setDescription(teamInfo?.team_description ?? '');
    setLoading(false);
    setIsOpen(true);
  };

  const handleClose = () => {
    setDescription(teamInfo?.team_description ?? '');
    setLoading(false);
    setIsOpen(false);
  };

  return (
    <div>
      <button className="edit-team-description-button" onClick={handleOpen}>Edit Description</button>

      {isOpen && (
        <div style={overlayStyles}>
          <div style={modalStyles} className="edit-description-modal">
            <h2>Edit Team Description</h2>
            <p>Enter team description:</p>
            <textarea
              className='text-input'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className='button-row'>
              <button className='close-button' onClick={handleClose}>Close</button>
              <button className='save-button' onClick={handleEdit} disabled={loading || description.trim() === ''}>
                {loading ? 'Loading ...' : 'Save'}
              </button>
            </div>
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

export default EditDescriptionButton;