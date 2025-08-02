export type NotificationType =
  | "task_completed"
  | "player_comment_added"
  | "coach_comment_added"
  | "player_removed"
  | "task_unapproved"
  | "player_submitted"
  | "player_removed"
;

export type notification = {
    notification_id: number;
    user_id: number;
    sent_from_id: number; // ID of the user who sent the notification
    type: NotificationType;
    content: string; // e.g., 'New task assigned', 'Comment on your post
    created_at: string; // ISO date string
    team_id: number;
    node_id: string;
    task_id: number;
    is_read: boolean; // true if the notification has been read, false otherwise
}