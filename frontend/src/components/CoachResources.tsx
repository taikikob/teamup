import type { CoachResource } from "../types/coachResource";
import DeleteMedia from "./DeleteMedia";
import { useTeam } from "../contexts/TeamContext";

function CoachResources({ loadingCoachResources, coachResources, refetch }: {
  loadingCoachResources: boolean;
  coachResources: CoachResource[];
  refetch: () => void;
}) {
    const { teamInfo } = useTeam();
  return (
    <div>
        <h3>Coach Resources</h3>
        { loadingCoachResources ? (
            <div>Loading coach resources...</div>
        ) : (
            <div>
            {coachResources.length === 0 ? (
                <div>Coach hasn't posted resources.</div>
            ) : (
                coachResources.map(resource => (
                // check resource.media_format to determine how to display
                <div key={resource.post_id}>
                    {resource.media_format === 'image' ? (
                        <img src={resource.media_url} alt={resource.caption || "Coach resource"} style={{ maxWidth: "100%" }} />
                    ) : resource.media_format === 'video' ? (
                        <video controls style={{ maxWidth: "100%" }}>
                            <source src={resource.media_url} />
                            Your browser does not support the video tag.
                        </video>
                    ) : (
                        <div style={{ color: "red", fontStyle: "italic" }}>
                            Resource type not supported. We only support photos and videos as of now.
                        </div>
                    )}
                    <div>{resource.caption}</div>
                    <div>Posted at {new Date(resource.created_at).toLocaleString()}</div>
                    {teamInfo?.is_user_coach && (
                        <div>
                            <DeleteMedia refetch={refetch} postId={resource.post_id} />
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

export default CoachResources;