export interface Task {
    task_id: number;
    title: string;
    task_order: number;
    completed?: boolean;
    description?: string;
}