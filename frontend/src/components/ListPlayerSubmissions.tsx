import type { PlayerSubmission } from "../types/playerSubmission";

function ListPlayerSubmissions({
  playerSubmissions,
  setSelectedSubmission,
  setSelected 
}: {
  playerSubmissions: PlayerSubmission[];
  setSelectedSubmission: React.Dispatch<React.SetStateAction<PlayerSubmission | null>>;
  setSelected: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    return (
        <div>
            <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "24px"
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
                                {submission.isSubmitted && submission.submitted_at && (
                                    <div style={{ fontWeight: "bold" }}>
                                        Submitted at {new Date(submission.submitted_at).toLocaleString()}
                                    </div>
                                )}
                                {submission.isComplete && submission.completed_at && (
                                    <div style={{ color: "green", fontWeight: "bold" }}>
                                        Approved at {new Date(submission.completed_at).toLocaleString()}
                                    </div>
                                )}
                            </div>
                        )}
                        {submission.isComplete && (
                            <div style={{ color: "green", fontWeight: "bold" }}>
                                Task Completed
                            </div>
                        )}
                        {submission.submissions.length === 0 && (
                            <div>
                                No uploads made by user.
                            </div>
                        )}
                    </div>
                ))}
                {playerSubmissions.length === 0 && (
                    <div>
                        No submissions available.
                    </div>
                )}
            </div>
        </div>
    );
}

export default ListPlayerSubmissions;