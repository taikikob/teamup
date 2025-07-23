import React from "react";
import type { Task } from "../types/task";
import { useTeam } from "../contexts/TeamContext";
import { useState } from "react";

const SIDEBAR_STYLES: React.CSSProperties = {
  position: "fixed",
  top: 0,
  right: 0,
  width: "1000px",
  height: "100%",
  background: "#fff",
  boxShadow: "-2px 0 8px rgba(0,0,0,0.1)",
  zIndex: 1100,
  padding: "32px",
  overflowY: "auto"
};

function TaskSidebar({ task, onClose }: { task: Task; onClose: () => void }) {
  const { teamInfo } = useTeam();
  const [coachFile, setCoachFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [playerFile, setPlayerFile] = useState<File | null>(null);

  const coachSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData();
    if (coachFile) {
      formData.append("image", coachFile);
    }
    formData.append("caption", caption);
    await fetch(`http://localhost:3000/api/posts/`, {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data' },
      body: formData,
      credentials: 'include'
    });
    setCoachFile(null); // Reset after submission
    setCaption(""); // Reset caption after submission
  }

  const playerSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData();
    if (playerFile) {
      formData.append("media", playerFile);
    }
    formData.append("caption", caption);
    await fetch(`http://localhost:3000/api/posts/`, {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data' },
      body: formData,
      credentials: 'include'
    });
    setPlayerFile(null); // Reset after submission
  }
  
  if (!task) return null;
  return (
    <div style={SIDEBAR_STYLES}>
      <h2>{task.title}</h2>
      <p>{task.description}</p>
      {/* Example for resources: */}
      { teamInfo?.is_user_coach && (
        <>
          <div>Coaches, upload any resources for this task here:</div>
          <form onSubmit={coachSubmit}>
            <input 
              onChange={e => {
                const file = e.target.files && e.target.files[0];
                if (file) setCoachFile(file);
              }}
              type="file" 
              accept="image/*"
            />
            <input value={caption} onChange={e => setCaption(e.target.value)} type="text" placeholder='Caption'></input>
            <button type="submit">Submit</button>
          </form>
        </>
      )}
      { !teamInfo?.is_user_coach && 
        <>
          <div>Submit your work to be reviewed:</div>
          <form onSubmit={playerSubmit}>
            <input
              onChange={e => {
                const file = e.target.files && e.target.files[0];
                if (file) setPlayerFile(file);
              }}
              type="file"
              accept="video/*"
            />
            <button type="submit">Submit</button>
          </form>
        </>
      }

      <button
        style={{
          marginTop: "24px",
          background: "#e74c3c",
          color: "white",
          border: "none",
          borderRadius: "6px",
          padding: "8px 16px",
          cursor: "pointer",
          fontWeight: 500
        }}
        onClick={onClose}
      >
        Close
      </button>
    </div>
  );
}

export default TaskSidebar;