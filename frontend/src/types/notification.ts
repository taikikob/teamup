export type notification = {
    notification_id: number;
    user_id: number;
    type: string; // e.g., 'task', 'comment', 'team'
    content: string; // e.g., 'New task assigned', 'Comment on your post
    created_at: string; // ISO date string
    team_id: number;
    node_id: string;
    task_id: number;
    is_read: boolean; // true if the notification has been read, false otherwise
}