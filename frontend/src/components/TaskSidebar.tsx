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
import '../css/TaskSidebar.css';

function TaskSidebar({ task, onClose, initialPlayerId }: { task: Task; onClose: () => void; initialPlayerId: string | null }) {
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
  const [unsubmitting, setUnsubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState(false);
  const [savingDescription, setSavingDescription] = useState(false);
  const [newDescription, setNewDescription] = useState(task.description || "");

  const coachFileInputRef = useRef<HTMLInputElement>(null); 
  const playerFileInputRef = useRef<HTMLInputElement>(null);

  const fetchCoachResources = async () => {
    if (teamInfo === null || task.task_id === undefined) {
      console.error("Team information or task ID is not available.");
      return;
    }
    setLoadingCoachResources(true);
    try {
      const res = await fetch(`https://teamup-server-beryl.vercel.app/api/posts/coachResources/${teamInfo.team_id}/${task.task_id}`, {
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
    if (!teamInfo || !task.task_id) {
      console.error("Team information or task ID is not available.");
      return;
    }
    setLoadingMyMedia(true);
    try {
      const res = await fetch(`https://teamup-server-beryl.vercel.app/api/posts/myMedia/${teamInfo.team_id}/${task.task_id}`, {
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
      const res = await fetch(`https://teamup-server-beryl.vercel.app/api/tasks/${teamInfo.team_id}/status/${task.task_id}`, {
        method: 'GET',
        credentials: 'include'
      });
      if (!res.ok) {
        console.error("Failed to fetch submission status");
        return;
      }
      const data = await res.json();
      setHasSubmitted(data.hasSubmitted);
      setSubmittedAt(data.submittedAt);
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
    const res = await fetch(`https://teamup-server-beryl.vercel.app/api/posts/${teamInfo.team_id}/coach`, {
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
    if (!teamInfo || !task.task_id) {
      toast.error("Team information or task ID is not available.", { position: "top-center" });
      return;
    }
    setAddingMedia(true);
    event.preventDefault();

    const formData = new FormData();
    if (playerFile) {
      formData.append("media", playerFile);
    }
    formData.append("taskId", String(task.task_id));
    const res = await fetch(`https://teamup-server-beryl.vercel.app/api/posts/${teamInfo.team_id}/player`, {
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
      const response = await fetch(`https://teamup-server-beryl.vercel.app/api/tasks/${teamInfo.team_id}/submit/${task.task_id}`, {
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
  };

  const unsubmitTask = async () => {
    setUnsubmitting(true);
    if (!teamInfo || !task.task_id) {
      toast.error("Team information or task ID is not available.", { position: "top-center" });
      setUnsubmitting(false);
      return;
    }
    try {
      const response = await fetch(`https://teamup-server-beryl.vercel.app/api/tasks/${teamInfo.team_id}/unsubmit/${task.task_id}`, {
        method: "DELETE",
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to unsubmit task:", errorData.error);
        toast.error("Failed to unsubmit task", { position: "top-center" });
        setUnsubmitting(false);
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
      setUnsubmitting(false);
    }
  };

  // Handler to save the new description (replace with your API call as needed)
  const handleSaveDescription = async () => {
    // TODO: Add API call to update description on the backend
    setSavingDescription(true);
    if (!teamInfo || !task.task_id) {
      toast.error("Team information or task ID is not available.", { position: "top-center" });
      return;
    }
    try {
      const response = await fetch(`https://teamup-server-beryl.vercel.app/api/tasks/${teamInfo.team_id}/description/${task.task_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ description: newDescription }),
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to update task description:", errorData.error);
        toast.error("Failed to update task description", { position: "top-center" });
        return;
      }
      const data = await response.json();
      toast.success(data.message, { position: "top-center" });
      // Update the task description locally
      task.description = newDescription;
    } catch (error) {
      console.error("Error occurred while updating task description:", error);
    } finally {
      setEditingDescription(false);
      setSavingDescription(false);
    }
    // Optionally update the task description in state if needed
  };

  if (!user) return null;
  if (!task) return null;
  return (
    <div className="task-sidebar">
      <h2>{task.title}</h2>
      <h3>Task Description</h3>
      {editingDescription ? (
        <div style={{ marginBottom: "12px" }}>
          <textarea
            value={newDescription}
            onChange={e => setNewDescription(e.target.value)}
            rows={3}
            style={{ width: "100%", borderRadius: "6px", padding: "8px" }}
          />
          <button
            className="save-button"
            onClick={handleSaveDescription}
            disabled={savingDescription}
          >
            {savingDescription ? "Saving..." : "Save"}
          </button>
          <button
            className="close-button"
            onClick={() => setEditingDescription(false)}
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          {!task.description || task.description.trim() === "" ? (
            <p>No description provided.</p>
          ) : (
            <p className="task-description">{task.description}</p>
          )}
          {teamInfo?.is_user_coach && (
            <button
              className="edit-description-button"
              onClick={() => setEditingDescription(true)}
            >
              Edit Description
            </button>
          )}
        </>
      )}
      <CoachResources loadingCoachResources={loadingCoachResources} coachResources={coachResources} refetch={fetchCoachResources} />
      { teamInfo?.is_user_coach && (
        <div className="coach-upload-section">
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
            <button type="submit" disabled={addingMedia || !coachFile}>
              {addingMedia ? "Posting..." : "Post Media"}
            </button>
          </form>
        </div>
      )}
      {teamInfo?.is_user_coach && (
        <PlayerSubmissions taskId={task.task_id} loadingComments={loadingComments} initialPlayerId={initialPlayerId} />
      )}
      {!teamInfo?.is_user_coach && (
        <>
          {/* If submitted, show Submitted Media */}
          {hasSubmitted ? (
            <h3 style={{ color: "#198754" }}>
              Submitted Media
            </h3>
          ) : (
            <h3>My Media</h3>
          )}
          
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
                  <p><strong>Important:</strong> Submit your media to be reviewed</p>
                  <button className='submit-task-button' onClick={playerSubmit} disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Task"}
                  </button>
                </div>
              )}
              {user && hasSubmitted && (
                <>
                  <p className="submitted_message">Task submitted at {submittedAt ? new Date(submittedAt).toLocaleString() : ""}</p>
                  <p>Waiting for coach to review your submission</p>
                  <button
                    className='unsubmit-task-button'
                    onClick={unsubmitTask}
                    disabled={unsubmitting}
                    style={{ cursor: unsubmitting ? "not-allowed" : "pointer", opacity: unsubmitting ? 0.6 : 1 }}
                  >
                    {unsubmitting ? "Unsubmitting..." : "Unsubmit"}
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
        className="close-button"
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