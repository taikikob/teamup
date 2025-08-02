export type NotificationType =
  | "task_completed"
  | "comment_added"
  | "player_removed"
  | "task_unapproved"
  | "player_submitted"
  | "player_removed"
;

export type notification = {
    notification_id: number;
    user_id: number;
    type: NotificationType;
    content: string; // e.g., 'New task assigned', 'Comment on your post
    created_at: string; // ISO date string
    team_id: number;
    node_id: string;
    task_id: number;
    is_read: boolean; // true if the notification has been read, false otherwise
}