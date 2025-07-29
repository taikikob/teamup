import { useState, useEffect } from "react";
import type { PlayerSubmission } from "../types/playerSubmission";
import MarkCompleteButton from "./MarkCompleteButton";
import ListPlayerSubmissions from "./ListPlayerSubmissions";
import { usePlayerSubmissions } from "../contexts/PlayerSubmissionsContext";
import CommentSection from "./CommentSection";

function PlayerSubmissions({ taskId, loadingComments }: { taskId: number, loadingComments: boolean }) {
    const [selectedSubmission, setSelectedSubmission] = useState<PlayerSubmission | null>(null);
    const [selected, setSelected] = useState(false);
    const { playerSubmissions, loadingPlayerSubmissions } = usePlayerSubmissions();

    useEffect(() => {
        setSelectedSubmission(null);
        setSelected(false);
    }, [taskId]);

    // separate submissions into waiting for review and reviewed
    const submitted = playerSubmissions.filter(sub => sub.isSubmitted && !sub.isComplete);
    const completed = playerSubmissions.filter(sub => sub.isComplete);
    const unsubmitted = playerSubmissions.filter(sub => !sub.isSubmitted && !sub.isComplete);
    console.log(submitted)
    return (
        <div>
            <h3>Player Submissions</h3>
            {loadingPlayerSubmissions ? (
                <div>Loading player submissions...</div>
            ) : (
                <>
                    { selected && selectedSubmission ? (
                        <div>
                            <h4>{selectedSubmission.first_name} {selectedSubmission.last_name}</h4>
                            {/* Display all submissions for the selected player */}
                            {selectedSubmission.submissions.length === 0 && (
                                <div>Player has not uploaded any media.</div>
                            )}
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
                            { selectedSubmission.isSubmitted && !selectedSubmission.isComplete && (
                                <div>
                                    <MarkCompleteButton 
                                        player_id={selectedSubmission.user_id} 
                                        task_id={selectedSubmission.task_id}
                                        setSelectedSubmission={setSelectedSubmission} 
                                        setSelected={setSelected}
                                    />
                                </div>  
                            )}
                            <CommentSection loadingComments={loadingComments} player_id={selectedSubmission.user_id} task_id={taskId}/>
                            <br />
                            <button onClick={() => {
                                setSelectedSubmission(null);
                                setSelected(false);
                            }}>Back to all submissions</button>
                        </div>
                    ) :(
                    <>
                        <h4>Awaiting Review:</h4>
                        <ListPlayerSubmissions 
                            playerSubmissions={submitted} 
                            setSelectedSubmission={setSelectedSubmission} 
                            setSelected={setSelected}
                        />
                        <h4>Approved:</h4>
                        <ListPlayerSubmissions 
                            playerSubmissions={completed} 
                            setSelectedSubmission={setSelectedSubmission} 
                            setSelected={setSelected}
                        />
                        <h4>Unsubmitted:</h4>
                        <ListPlayerSubmissions 
                            playerSubmissions={unsubmitted} 
                            setSelectedSubmission={setSelectedSubmission} 
                            setSelected={setSelected}
                        />
                    </>
                    )}
               </>
            )}
        </div>
    );
}

export default PlayerSubmissions;