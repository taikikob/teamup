import { useState } from 'react';
import { toast } from 'react-toastify';
import { useTeam } from '../contexts/TeamContext'
import type { Node } from 'reactflow';
import '../css/AddNewTaskButton.css';

function AddNewTaskButton({ node, taskCount, onTaskAdded }: { node: Node, taskCount: number, onTaskAdded: () => void }) {
  const { teamInfo } = useTeam(); // Consume the context
  const [isOpen, setIsOpen] = useState(false);
  const [inputTitle, setInputTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const nextOrder = taskCount;

  const handleAddNewTask = async () => {
    if (!teamInfo || !teamInfo.team_id) {
      toast.error('Team information is not available.', { position: 'top-center' });
      return;
    }
    try {
      // send post request to my backend
      setLoading(true);
      console.log("Adding new task with title:", inputTitle, "to node:", node.id, "in team:", teamInfo.team_id);
      const res = await fetch(`https://teamup-five.vercel.app/api/teams/${teamInfo.team_id}/${node.id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
            input_title: inputTitle,
            task_order: nextOrder
        }),
      });
      
      // retrieve message
      const data = await res.json();
      if (res.status === 201) {
        // close modal
        setIsOpen(false);
        onTaskAdded(); // Call the onTaskAdded prop to refresh tasks
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
    setInputTitle('');
    setLoading(false);
    setIsOpen(true);
  };

  const handleClose = () => {
    setInputTitle('');
    setLoading(false);
    setIsOpen(false);
  };

  return (
    <div>
      <button className="add-task-button" onClick={handleOpen}>Add Task</button>

      {isOpen && (
        <div style={overlayStyles}>
          <div style={modalStyles} className="add-task-modal">
            <h2>Add a New Task</h2>
            <p>Enter Task Title:</p>
            <input
              type="text"
              value={inputTitle}
              className='text-input'
              onChange={(e) => setInputTitle(e.target.value)}
            />
            <button className="add-task-button" onClick={handleAddNewTask} disabled={loading || inputTitle.trim() === ''}>
              {loading ? 'Loading...' : 'Add New Task'}
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

export default AddNewTaskButton;