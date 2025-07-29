import React, { useState, useEffect, useRef } from "react";
import type { Task } from "../types/task";
import { useTeam } from "../contexts/TeamContext";
import type { CoachResource } from "../types/coachResource";
import type { PlayerSubmission } from "../types/playerSubmission";
import PlayerSubmissions from "./PlayerSubmissions";
import CoachResources from "./CoachResources";
import MyMedias from "./MyMedias";
import CommentSection from "./CommentSection";
import { toast } from 'react-toastify';
import { useUser } from "../contexts/UserContext";
import { usePlayerSubmissions } from "../contexts/PlayerSubmissionsContext";
import { useComments } from "../contexts/CommentsContext";

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
  const { fetchPlayerSubmissions, clearPlayerSubmissions } = usePlayerSubmissions();
  const { user } = useUser();
  const { loadingComments, fetchComments, clearComments } = useComments();
  const [coachFile, setCoachFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [playerFile, setPlayerFile] = useState<File | null>(null);
  const [loadingCoachResources, setLoadingCoachResources] = useState(false);
  const [coachResources, setCoachResources] = useState<CoachResource[]>([]);
  // State to hold each player's own media, only player sees this
  const [myMedia, setMyMedia] = useState<PlayerSubmission | null>(null);
  const [loadingMyMedia, setLoadingMyMedia] = useState(false);
  const [addingMedia, setAddingMedia] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);

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

  // Used to fetch all the player's own media uploads
  const fetchMyMedia = async () => {
    setLoadingMyMedia(true);
    try {
      const res = await fetch(`http://localhost:3000/api/posts/myMedia/${task.task_id}`, {
        credentials: 'include'
      });
      if (!res.ok) {
        console.error("Failed to fetch my media");
        return;
      }
      const data = await res.json();
      console.log("Fetched my media:", data);
      setMyMedia(data);
    } catch (error) {
      console.error("Error fetching my media:", error);
    } finally {
      setLoadingMyMedia(false);
    }
  }

  // Used to check if the player has submitted the task and whether approved by coach
  const fetchSubmissionStatus = async () => {
    if (!teamInfo || !task.task_id) {
      console.error("Team information or task ID is not available.");
      return;
    }
    try {
      const res = await fetch(`http://localhost:3000/api/tasks/status/${task.task_id}`, {
        method: 'GET',
        credentials: 'include'
      });
      if (!res.ok) {
        console.error("Failed to fetch submission status");
        return;
      }
      const data = await res.json();
      setHasSubmitted(data.hasSubmitted);
      setCompleted(data.hasCompleted);
    } catch (error) {
      console.error("Error fetching submission status:", error);
    }
  }

  useEffect(() => {
    if (!teamInfo) return;
    // Fetch any resources that coach has uploaded for this task
    fetchCoachResources();
    fetchComments(task.task_id);
    if (teamInfo.is_user_coach) {
      // Fetch player submissions only if the user is a coach
      fetchPlayerSubmissions(teamInfo.team_id, task.task_id);
    } else {
      // Fetch the player's own submissions
      fetchSubmissionStatus();
      fetchMyMedia();
    }
  }, [teamInfo, task]);

  const coachSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    setAddingMedia(true);
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
    setAddingMedia(false);
  };

  const playerAddMedia = async (event: React.FormEvent<HTMLFormElement>) => {
    setAddingMedia(true);
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
    fetchMyMedia();
    setAddingMedia(false);
  };

  const playerSubmit = async () => {
    if (!teamInfo || !task.task_id) {
      toast.error("Team information or task ID is not available.", { position: "top-center" });
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`http://localhost:3000/api/tasks/submit/${task.task_id}`, {
        method: "POST",
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to mark task as complete:", errorData.error);
        toast.error("Failed to mark task as complete", { position: "top-center" });
        return;
      }
      const data = await response.json();
      toast.success(data.message, { position: "top-center" });
      setSubmittedAt(data.submittedAt);
    } catch (error) {
      console.error("Error occurred while submitting task:", error);
    } finally {
      setSubmitting(false);
      setHasSubmitted(true); // Refetch submission status after submitting
    }
  }

  const unsubmitTask = async () => {
    if (!teamInfo || !task.task_id) {
      toast.error("Team information or task ID is not available.", { position: "top-center" });
      return;
    }
    try {
      const response = await fetch(`http://localhost:3000/api/tasks/unsubmit/${task.task_id}`, {
        method: "DELETE",
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to unsubmit task:", errorData.error);
        toast.error("Failed to unsubmit task", { position: "top-center" });
        return;
      }
      if (response.status === 204) {
        toast.success("Task unsubmitted successfully.", { position: "top-center" });
        setHasSubmitted(false);
      }
    } catch (error) {
      console.error("Error occurred while un-submitting task:", error);
    } finally {
      setSubmittedAt(null); // Reset submittedAt state
    }
  }
  if (!user) return null;
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
            <button type="submit" disabled={addingMedia}>
              {addingMedia ? "Posting..." : "Post Media"}
            </button>
          </form>
        </>
      )}
      {teamInfo?.is_user_coach && (
        <PlayerSubmissions taskId={task.task_id} loadingComments={loadingComments} />
      )}
      {!teamInfo?.is_user_coach && (
        <>
          <h3>My Media</h3>
          {myMedia ? (
            <MyMedias loadingMySubmissions={loadingMyMedia} media={myMedia} refetch={fetchMyMedia} hasSubmitted={hasSubmitted} />
          ) : (
            <p>No media uploaded yet.</p>
          )}
          {!hasSubmitted && (
            <>
              <div>Upload your media:</div>
              <form onSubmit={playerAddMedia}>
                <input
                  ref={playerFileInputRef}
                  onChange={e => {
                    const file = e.target.files && e.target.files[0];
                    if (file) setPlayerFile(file);
                  }}
                  type="file"
                  accept="image/*, video/*"
                />
                <button type="submit" disabled={addingMedia}>
                  {addingMedia ? "Adding..." : "Add Media"}
                </button>
              </form>
            </>
          )}
          {!loadingMyMedia && (
            <>
              {/* Only show the submit button if user has something to submit, and hasn't submitted yet */}
              {user && myMedia && myMedia.submissions && myMedia.submissions.length > 0 && !hasSubmitted && (
                <div>
                  <p>Submit your media to be reviewed</p> 
                  <button onClick={playerSubmit} disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Task"}
                  </button>
                </div>
              )}
              {user && hasSubmitted && (
                <>
                  <p>Task submitted at {submittedAt ? new Date(submittedAt).toLocaleString() : ""}</p>
                  <p>Waiting for coach to review your submission</p>
                  <button onClick={unsubmitTask} style={{ color: "red", marginTop: "8px" }}>
                    Unsubmit
                  </button>
                </>
              )}
              {user && (!myMedia || !myMedia.submissions || myMedia.submissions.length === 0) && (
                <div style={{ color: "orange", marginTop: "8px" }}>
                  Please upload your media before submitting the task.
                </div>
              )}
              {!user && (
                <div style={{ color: "red", marginTop: "12px" }}>
                  Error: User information is not available. Please log in again.
                </div>
              )}
              {completed && (
                <div style={{ color: "green", marginTop: "12px" }}>
                  Congrats! Coach has reviewed your submission and approved it as complete.
                </div>
              )}
            </>
          )}
          <CommentSection loadingComments={loadingComments} player_id={user.user_id} task_id={task.task_id}/>
        </>
      )}
      <br></br>
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
        onClick={() => {
          onClose();
          clearPlayerSubmissions();
          clearComments();
        }}
      >
        Close
      </button>
    </div>
  );
}

export default TaskSidebar;