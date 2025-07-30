export interface Task {
    task_id: string;
    title: string;
    task_order: number;
    completed?: boolean;
    description?: string;
}