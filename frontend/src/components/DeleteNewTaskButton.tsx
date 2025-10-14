import { useState } from 'react';
import type { Task } from '../types/task';
import '../css/DeleteNewTaskButton.css';

function DeleteNewTaskButton({ task, handleDelete }: { task: Task; handleDelete: () => void }) {
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
        Delete
      </button>

      {isOpen && (
        <div style={overlayStyles}>
          <div style={modalStyles} className='delete-task-modal' onClick={e => e.stopPropagation()}>
            <h2>Delete Task</h2>
            <p>Are you sure you want to delete this task:</p><strong>{task.title}</strong>
            <p>Deleting this task will remove <strong>all</strong> data (media submitted from players, player progress, etc.) associated with it.</p>
            <button 
              onClick={e => {
                e.stopPropagation();
                handleDelete();
              }} 
              disabled={loading}
              className='delete-button'
              style={{ cursor: loading ? "not-allowed" : "pointer" }}
            >
              {loading ? 'Loading...' : 'Delete Task'}
            </button>
            <button onClick={e => {
              e.stopPropagation();
              handleClose();
            }}
            className='close-button'
            >Close</button>
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
  borderRadius: '8px',
};

export default DeleteNewTaskButton;