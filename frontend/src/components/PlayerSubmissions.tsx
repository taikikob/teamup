import { useEffect, useState } from "react";
import type { PlayerSubmission } from "../types/playerSubmission";
import MarkCompleteButton from "./MarkCompleteButton";

function PlayerSubmissions({ fetchPlayerSubmissions, loadingPlayerSubmissions, playerSubmissions }: { fetchPlayerSubmissions: () => void; loadingPlayerSubmissions: boolean; playerSubmissions: PlayerSubmission[] }) {
    const [selectedSubmission, setSelectedSubmission] = useState<PlayerSubmission | null>(null);
    const [selected, setSelected] = useState(false);

    // separate submissions into waiting for review and reviewed
    const waitingReview = playerSubmissions.filter(sub => !sub.isComplete);
    const reviewed = playerSubmissions.filter(sub => sub.isComplete);

    return (
        <div>
            <h3>Player Submissions</h3>
            {loadingPlayerSubmissions ? (
                <div>Loading player submissions...</div>
            ) : playerSubmissions.length === 0 ? (
                <p>No submissions yet.</p>
            ) : (
                <>
                    { selected && selectedSubmission ? (
                        <div>
                            <h4>{selectedSubmission.first_name} {selectedSubmission.last_name}</h4>
                            {/* Display all submissions for the selected player */}
                            {selectedSubmission.submissions.map((sub, index) => (
                                <div key={index}>
                                    {sub.media_format === 'image' ? (
                                        <img
                                            src={sub.media_url}
                                            alt="Player submission"
                                            style={{ maxWidth: "100%", maxHeight: 300, display: "block" }}
                                        />
                                    ) : sub.media_format === 'video' ? (
                                        <video controls style={{ maxWidth: "100%", maxHeight: 300 }}>
                                            <source src={sub.media_url} />
                                            Your browser does not support the video tag.
                                        </video>
                                    ) : (
                                        <div style={{ color: "red", fontStyle: "italic" }}>
                                            This type of submission is not supported yet. We only support photos and videos as of now.
                                        </div>
                                    )}
                                    <div>Submitted at {new Date(sub.created_at).toLocaleString()}</div>
                                </div>
                            ))}
                            <MarkCompleteButton player_id={selectedSubmission.user_id} task_id={selectedSubmission.task_id}/>
                            <button onClick={() => {
                                setSelectedSubmission(null);
                                setSelected(false);
                                // To make sure the completion changes is reflected
                                fetchPlayerSubmissions();
                            }}>Back to all submissions</button>
                        </div>
                    ) :(
                        <div style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "24px",
                            marginTop: "16px"
                        }}>
                            {playerSubmissions.map((submission) => (
                                <div 
                                key={submission.user_id}
                                onClick={() => {
                                    setSelectedSubmission(submission);
                                    setSelected(true);
                                }}
                                style={{
                                    border: "2px solid black",
                                    borderRadius: "10px",
                                    padding: "16px",
                                    minWidth: "320px",
                                    maxWidth: "400px",
                                    background: "#fafafa",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                                    flex: "1 1 320px",
                                    cursor: "pointer",
                                }}>
                                    <h4>{submission.first_name} {submission.last_name}</h4>
                                    {/* Display the first submission's media as a preview */}
                                    {submission.submissions.length > 0 && (
                                        <div>
                                            {submission.submissions[0].media_format === 'image' ? (
                                                <img
                                                    src={submission.submissions[0].media_url}
                                                    alt="Player submission"
                                                    style={{ maxWidth: "100%", maxHeight: 300, display: "block" }}
                                                />
                                            ) : submission.submissions[0].media_format === 'video' ? (
                                                <video controls style={{ maxWidth: "100%", maxHeight: 300 }}>
                                                    <source src={submission.submissions[0].media_url} />
                                                    Your browser does not support the video tag.
                                                </video>
                                            ) : (
                                                <div style={{ color: "red", fontStyle: "italic" }}>
                                                    This type of submission is not supported yet. We only support photos and videos as of now.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div>Submitted at {new Date(submission.submissions[0].created_at).toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                    )}
               </>
            )}
        </div>
    );
}

export default PlayerSubmissions;