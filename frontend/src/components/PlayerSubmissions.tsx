import type { PlayerSubmission } from "../types/playerSubmission";

function PlayerSubmissions({ loadingPlayerSubmissions, playerSubmissions }: { loadingPlayerSubmissions: boolean; playerSubmissions: PlayerSubmission[] }) {
    return (
        <div>
            <h3>Player Submissions</h3>
            {loadingPlayerSubmissions ? (
                <div>Loading player submissions...</div>
            ) : playerSubmissions.length === 0 ? (
                <p>No submissions yet.</p>
            ) : (
                <div>
                    {playerSubmissions.map((submission) => (
                        <div key={submission.user_id}>
                            <h4>{submission.first_name} {submission.last_name}</h4>
                            {submission.submissions.map((sub, index) => (
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
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default PlayerSubmissions;