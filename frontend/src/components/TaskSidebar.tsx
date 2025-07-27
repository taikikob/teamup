import React, { useState, useEffect, useRef } from "react";
import type { Task } from "../types/task";
import { useTeam } from "../contexts/TeamContext";
import type { CoachResource } from "../types/coachResource";
import type { PlayerSubmission } from "../types/playerSubmission";
import PlayerSubmissions from "./PlayerSubmissions";
import CoachResources from "./CoachResources";
import MySubmissions from "./MySubmissions";
import { toast } from 'react-toastify';

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
  const [loadingCoachResources, setLoadingCoachResources] = useState(false);
  const [coachResources, setCoachResources] = useState<CoachResource[]>([]);
  const [loadingPlayerSubmissions, setLoadingPlayerSubmissions] = useState(false);
  // State to hold all player submissions, only coach sees this
  const [playerSubmissions, setPlayerSubmissions] = useState<PlayerSubmission[]>([]);
  // State to hold each player's own submissions, only player sees this
  const [mySubmissions, setMySubmissions] = useState<PlayerSubmission | null>(null);
  const [loadingMySubmissions, setLoadingMySubmissions] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const coachFileInputRef = useRef<HTMLInputElement>(null); 
  const playerFileInputRef = useRef<HTMLInputElement>(null);

  const fetchCoachResources = async () => {
    setLoadingCoachResources(true);
    try {
      const res = await fetch(`http://localhost:3000/api/posts/coachResources/${task.task_id}`, {
        credentials: 'include'
      });
      if (!res.ok) {
        console.error("Failed to fetch coach resources");
        return;
      }
      const data = await res.json();
      setCoachResources(Array.isArray(data) ? data : []);
      // Handle the fetched data as needed
      console.log("Fetched coach resources:", data);
    } catch (error) {
      console.error("Error fetching coach resources:", error);
    } finally {
      setLoadingCoachResources(false);
    }
  }

  const fetchPlayerSubmissions = async () => {
    setLoadingPlayerSubmissions(true);
    try {
      const res = await fetch(`http://localhost:3000/api/posts/playerSubmissions/${task.task_id}`, {
        credentials: 'include'
      });
      if (!res.ok) {
        console.error("Failed to fetch player submissions");
        return;
      }
      const data = await res.json();
      setPlayerSubmissions(data);
    } catch (error) {
      console.error("Error fetching player submissions:", error);
    } finally {
      setLoadingPlayerSubmissions(false);
    }
  }

  const fetchMySubmissions = async () => {
    setLoadingMySubmissions(true);
    try {
      const res = await fetch(`http://localhost:3000/api/posts/mySubmissions/${task.task_id}`, {
        credentials: 'include'
      });
      if (!res.ok) {
        console.error("Failed to fetch my submissions");
        return;
      }
      const data = await res.json();
      console.log("Fetched my submissions:", data);
      setMySubmissions(data);
    } catch (error) {
      console.error("Error fetching my submissions:", error);
    } finally {
      setLoadingMySubmissions(false);
    }
  }

  useEffect(() => {
    if (!teamInfo) return;
    // Fetch any resources that coach has uploaded for this task
    fetchCoachResources();
    if (teamInfo.is_user_coach) {
      // Fetch player submissions only if the user is a coach
      fetchPlayerSubmissions();
    } else {
      // Fetch the player's own submissions
      fetchMySubmissions();
    }
  }, [teamInfo, task]);

  const coachSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    setSubmitting(true);
    event.preventDefault();
    if (!teamInfo) return;

    const formData = new FormData();
    if (coachFile) {
      formData.append("media", coachFile);
    }
    formData.append("caption", caption);
    formData.append("taskId", String(task.task_id));
    const res = await fetch(`http://localhost:3000/api/posts/coach`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    if (!res.ok) {
      const errorData = await res.json();
      console.error("Failed to submit coach post:", errorData.error); 
      return;
    }
    const data = await res.json();
    if (res.status === 201) {
      // show a success toast notification
      toast.success(data.message, { position: 'top-center' });
    }
    setCoachFile(null);
    setCaption("");
    if (coachFileInputRef.current) {
      coachFileInputRef.current.value = ""; // <-- Reset the file input
    }
    fetchCoachResources();
    setSubmitting(false);
  };

  const playerSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    setSubmitting(true);
    event.preventDefault();

    const formData = new FormData();
    if (playerFile) {
      formData.append("media", playerFile);
    }
    formData.append("taskId", String(task.task_id));
    const res = await fetch(`http://localhost:3000/api/posts/player`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    if (!res.ok) {
      const errorData = await res.json();
      console.error("Failed to submit player post:", errorData.error);
      return;
    }
    const data = await res.json();
    if (res.status === 201) {
      // show a success toast notification
      toast.success(data.message, { position: 'top-center' });
    }
    setPlayerFile(null);
    if (playerFileInputRef.current) {
      playerFileInputRef.current.value = ""; // <-- Reset the file input
    }
    fetchMySubmissions();
    setSubmitting(false);
  };

  if (!task) return null;
  return (
    <div style={SIDEBAR_STYLES}>
      <h2>{task.title}</h2>
      <p>{task.description}</p>
      <CoachResources loadingCoachResources={loadingCoachResources} coachResources={coachResources} refetch={fetchCoachResources} />
      { teamInfo?.is_user_coach && (
        <>
          <div>Coaches, upload any resources for this task here:</div>
          <form onSubmit={coachSubmit}>
            <input 
              ref={coachFileInputRef}
              onChange={e => {
                const file = e.target.files && e.target.files[0];
                if (file) setCoachFile(file);
              }}
              type="file" 
              accept="image/*, video/*"
            />
            <input value={caption} onChange={e => setCaption(e.target.value)} type="text" placeholder='Caption'></input>
            <button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </form>
        </>
      )}
      {teamInfo?.is_user_coach && (
        <PlayerSubmissions loadingPlayerSubmissions={loadingPlayerSubmissions} playerSubmissions={playerSubmissions} />
      )}
      {!teamInfo?.is_user_coach && (
        <>
          <h3>My Submissions</h3>
          {mySubmissions ? (
            <MySubmissions loadingMySubmissions={loadingMySubmissions} submission={mySubmissions} refetch={fetchMySubmissions} />
          ) : (
            <p>No submissions found.</p>
          )}
          <div>Submit your work to be reviewed:</div>
          <form onSubmit={playerSubmit}>
            <input
              ref={playerFileInputRef}
              onChange={e => {
                const file = e.target.files && e.target.files[0];
                if (file) setPlayerFile(file);
              }}
              type="file"
              accept="image/*, video/*"
            />
            <button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </form>
        </>
      )}
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