export type PlayerSubmission = {
    user_id: number;
    first_name: string;
    last_name: string;
    submissions: {
        post_id: number;
        media_url: string;
        created_at: string;
        media_format: string; // 'image', 'video', 'other'
    }[];
}