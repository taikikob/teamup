import React, { useState } from "react";
import { useComments } from "../contexts/CommentsContext";
import { useUser } from "../contexts/UserContext";
import { useTeam } from "../contexts/TeamContext";
import { toast } from "react-toastify";

type CommentSectionProps = {
    loadingComments: boolean;
    player_id: number; // The ID of the player whose comments are being viewed
    task_id: number; // The ID of the task for which comments are being viewed
};

function CommentSection({loadingComments, player_id, task_id }: CommentSectionProps) {
    const { comments, addComment, deleteComment, filterComments } = useComments();
    const { user } = useUser(); // user.user_id is the sender_id for the comment
    const { teamInfo } = useTeam();
    const [content, setContent] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    if (!teamInfo) {
        return <p>Loading team information...</p>;
    }
    console.log("All comments:", comments);
    console.log("Player ID:", player_id);
    console.log("Coach Ids:", teamInfo.coaches_info.map(coach => coach.user_id));
    const filteredComments = filterComments(player_id, teamInfo.coaches_info.map(coach => coach.user_id) || []);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || !user) return;
        setSubmitting(true);
        await addComment({
            player_id,
            sender_id: user.user_id,
            task_id,
            content: content.trim(),
            sender_name: user.first_name + " " + user.last_name // Assuming user has first_name and last_name
        });
        toast.success("Comment added successfully!", { position: "top-center" });
        setContent("");
        setSubmitting(false);
    };

    const handleDelete = async (comment_id: number) => {
        setDeletingId(comment_id);
        await deleteComment(comment_id);
        setDeletingId(null);
    };

    return (
        <div className="comment-section">
            <h4>Comments</h4>
            {loadingComments ? (
                <p>Loading comments...</p>
            ) : filteredComments.length === 0 ? (
                <p>No comments found.</p>
            ) : (
                <div>
                    {filteredComments.map(comment => (
                        <div className="comment" key={comment.comment_id}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
                                <img
                                    src={
                                        (teamInfo.players_info.concat(teamInfo.coaches_info)
                                            .find(person => person.user_id === comment.sender_id)?.profile_picture_link)
                                        || "/default_pp.png"
                                    }
                                    className="profile-icon"
                                    alt={`${comment.sender_name}'s profile picture`}
                                />
                                 <strong>{comment.sender_name}</strong> <em>{new Date(comment.created_at).toLocaleString()}</em>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <p>{comment.content}</p>
                                {/* Only show delete button if the user is the sender */}
                                {(user?.user_id === comment.sender_id) && (
                                    deletingId === comment.comment_id ? (
                                        <span>Deleting...</span>
                                    ) : (
                                        <button onClick={() => handleDelete(comment.comment_id)}>Delete</button>
                                    )
                                )}
                            </div>
                            
                        </div>
                    ))}
                </div>
            )}
            <form onSubmit={handleSubmit} style={{ marginBottom: "1rem" }}>
                <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Add a comment..."
                    rows={3}
                    style={{ width: "100%" }}
                    disabled={submitting}
                />
                <button type="submit" disabled={submitting || !content.trim()}>
                    {submitting ? "Posting..." : "Post Comment"}
                </button>
            </form>
        </div>
    )
}

export default CommentSection;