import React, { useState } from "react";
import { useComments } from "../contexts/CommentsContext";
import { useUser } from "../contexts/UserContext";
import { useTeam } from "../contexts/TeamContext";
import { toast } from "react-toastify";
import "./../css/CommentSection.css";

type CommentSectionProps = {
    loadingComments: boolean;
    player_id: number; // The ID of the player whose comments are being viewed
    task_id: number; // The ID of the task for which comments are being viewed
};

function CommentSection({loadingComments, player_id, task_id }: CommentSectionProps) {
    const { addComment, deleteComment, filterComments } = useComments();
    const { user } = useUser();
    const { teamInfo } = useTeam();
    const [content, setContent] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    if (!teamInfo) {
        return <p className="cs-empty">Loading team information...</p>;
    }

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
            sender_name: user.first_name + " " + user.last_name
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
        <div className="cs-container">
            <div className="cs-header">
                <h4 className="cs-title">Comments</h4>
                <span className="cs-count">{filteredComments.length}</span>
            </div>

            {loadingComments ? (
                <p className="cs-empty">Loading comments...</p>
            ) : filteredComments.length === 0 ? (
                <p className="cs-empty">No comments yet.</p>
            ) : (
                <div className="cs-list">
                    {filteredComments.map(comment => {
                        const sender = teamInfo.players_info.concat(teamInfo.coaches_info)
                            .find(person => person.user_id === comment.sender_id);
                        const avatar = sender?.profile_picture_link || "/default_pp.svg";
                        return (
                            <div className="cs-comment" key={comment.comment_id}>
                                <img src={avatar} alt="" className="cs-avatar" />
                                <div className="cs-body">
                                    <div className="cs-meta">
                                        <strong className="cs-sender">{comment.sender_name}</strong>
                                        <time className="cs-time">{new Date(comment.created_at).toLocaleString()}</time>
                                    </div>
                                    <p className="cs-text">{comment.content}</p>
                                </div>
                                {user?.user_id === comment.sender_id && (
                                    <div className="cs-actions">
                                        {deletingId === comment.comment_id ? (
                                            <span className="cs-deleting">Deleting…</span>
                                        ) : (
                                            <button
                                                onClick={() => handleDelete(comment.comment_id)}
                                                className="cs-delete"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <form onSubmit={handleSubmit} className="cs-form">
                <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Add a comment..."
                    rows={3}
                    className="cs-textarea"
                    disabled={submitting}
                />
                <div className="cs-form-row">
                    <button
                        type="submit"
                        disabled={submitting || !content.trim()}
                        className="cs-post"
                    >
                        {submitting ? "Posting..." : "Post"}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default CommentSection;