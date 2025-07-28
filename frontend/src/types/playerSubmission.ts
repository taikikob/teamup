export type PlayerSubmission = {
    user_id: number;
    first_name: string;
    last_name: string;
    task_id: string;
    isComplete: boolean; 
    isSubmitted: boolean;
    completed_at: string|null; // null if the task is not complete
    submitted_at: string|null; // null if the task is not submitted
    // submissions can be empty if the player has not submitted anything
    submissions: {
        post_id: number;
        media_url: string;
        created_at: string;
        media_format: string; // 'image', 'video', 'other'
    }[];
}