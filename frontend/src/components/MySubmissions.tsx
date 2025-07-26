import type { PlayerSubmission } from "../types/playerSubmission";
import DeleteMedia from "./DeleteMedia";

// PlayerSubmissions contains a list of all player submissions for the task

function MySubmissions({ loadingMySubmissions, submission, refetch }: { loadingMySubmissions: boolean; submission: PlayerSubmission; refetch: () => void }) {
  return (
    <div>
        {loadingMySubmissions ? (
            <div>Loading my submissions...</div>
        ) : (
            <div>
            {submission.submissions.length === 0 ? (
                <div>You haven't submitted anything yet.</div>
            ) : (
                submission.submissions.map((sub, index) => (
                <div key={index}>
                    {sub.media_format === 'image' ? (
                    <img src={sub.media_url} alt="My submission" style={{ maxWidth: "100%" }} />
                    ) : sub.media_format === 'video' ? (
                    <video controls style={{ maxWidth: "100%" }}>
                        <source src={sub.media_url} />
                        Your browser does not support the video tag.
                    </video>
                    ) : (
                    <div style={{ color: "red", fontStyle: "italic" }}>
                        Resource type not supported. We only support photos and videos as of now.
                    </div>
                    )}
                    <div>Submitted at {new Date(sub.created_at).toLocaleString()}</div>
                    <DeleteMedia postId={sub.post_id} refetch={refetch} />
                </div>
                ))
            )}
            </div>
        )}
    </div>
  );
}

export default MySubmissions;