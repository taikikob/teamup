import React, { createContext, useContext, useState, useCallback } from "react";
import type { Comment } from "../types/comment";

type CommentsContextType = {
  comments: Comment[];
  loadingComments: boolean;
  fetchComments: (taskId: number) => Promise<void>;
  addComment: (comment: Omit<Comment, "comment_id" | "created_at" >) => Promise<void>;
  deleteComment: (comment_id: number) => Promise<void>;
  filterComments: (player_id: number, coach_ids: number[]) => Comment[];
  clearComments: () => void;
};

const CommentsContext = createContext<CommentsContextType | undefined>(undefined);

export const CommentsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  // Fetch all comments for a task
  const fetchComments = useCallback(async (taskId: number) => {
    setLoadingComments(true);
    setComments([]);
    try {
      const res = await fetch(`http://localhost:3000/api/comments/${taskId}`, {
        credentials: "include",
      });
      if (!res.ok) {
        console.error("Failed to fetch comments");
        return;
      }
      const data = await res.json();
      setComments(data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoadingComments(false);
    }
  }, []);

  // Add a comment to DB and context
  const addComment = useCallback(
    async (comment: Omit<Comment, "comment_id" | "created_at" >) => {
      try {
        const res = await fetch(`http://localhost:3000/api/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(comment),
        });
        if (!res.ok) {
          throw new Error("Failed to add comment");
        }
        const newComment = await res.json();
        // Add the sender's name to the new comment
        newComment.sender_name = comment.sender_name;
        setComments((prev) => [...prev, newComment]);
      } catch (error) {
        console.error("Error adding comment:", error);
      }
    },
    []
  );

  // Delete a comment from DB and context
  const deleteComment = useCallback(async (comment_id: number) => {
    try {
      const res = await fetch(`http://localhost:3000/api/comments/${comment_id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to delete comment");
      }
      setComments((prev) => prev.filter((c) => c.comment_id !== comment_id));
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  }, []);

  // Filter comments between coaches and player for a task
  // There can be multiple coaches in a team
  // Filter the comments based on player_id and the ids of the coaches
  const filterComments = useCallback(
    (player_id: number, coach_ids: number[]) =>
      comments.filter(
        (c) =>
          (c.player_id === player_id && coach_ids.includes(c.sender_id)) ||
          (c.player_id === player_id && c.sender_id === player_id)
      ),
    [comments]
  );

  // Clear comments (e.g., when switching tasks)
  const clearComments = useCallback(() => setComments([]), []);

  return (
    <CommentsContext.Provider
      value={{
        comments,
        loadingComments,
        fetchComments,
        addComment,
        deleteComment,
        filterComments,
        clearComments,
      }}
    >
      {children}
    </CommentsContext.Provider>
  );
};

export const useComments = () => {
  const ctx = useContext(CommentsContext);
  if (!ctx) throw new Error("useComments must be used within a CommentsProvider");
  return ctx;
};