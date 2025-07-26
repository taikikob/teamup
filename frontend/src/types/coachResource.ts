export type CoachResource = {
  post_id: number;
  user_id: number;
  task_id: number;
  caption: string | null;
  media_type: string;
  created_at: string; // or Date, depending on how you parse it
  media_name: string;
  media_url: string; // added by your code
  media_format: string; // 'image', 'video', 'other'
};