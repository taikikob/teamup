import type { PlayerSubmission } from "../types/playerSubmission";
import DeleteMedia from "./DeleteMedia";
import '../css/MyMedias.css';

// PlayerSubmission contains a list of all player media for the task

function MyMedias({ loadingMySubmissions, media, refetch, hasSubmitted }: { loadingMySubmissions: boolean; media: PlayerSubmission; refetch: () => void; hasSubmitted: boolean }) {
  return (
    <div className="my-medias">
        {loadingMySubmissions ? (
            <div>Loading my submissions...</div>
        ) : (
            <div>
            {media.submissions.length === 0 ? (
                <div>You haven't submitted anything yet.</div>
            ) : (
                media.submissions.map((med, index) => (
                <div key={med.post_id ?? index} className="media-item">
                    {med.media_format === 'image' ? (
                    <img src={med.media_url} alt="My media" />
                    ) : med.media_format === 'video' ? (
                    <video controls>
                        <source src={med.media_url} />
                        Your browser does not support the video tag.
                    </video>
                    ) : (
                    <div style={{ color: "red", fontStyle: "italic" }}>
                        Resource type not supported. We only support photos and videos as of now.
                    </div>
                    )}
                    <div className="media-meta">Uploaded at {new Date(med.created_at).toLocaleString()}</div>
                    {/* Only show delete button if player has not submitted the task */}
                    {!hasSubmitted && (
                        <div className="delete-media-btn">
                          <DeleteMedia postId={med.post_id} refetch={refetch} />
                        </div>
                    )}
                </div>
                ))
            )}
            </div>
        )}
    </div>
  );
}

export default MyMedias;