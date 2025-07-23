import type { Node } from 'reactflow';
import { createPortal } from 'react-dom';
import { useTeam } from "../contexts/TeamContext";
import { useState, useEffect } from 'react';
import AddNewTaskButton from './AddNewTaskButton';
import SortableTask from './SortableTask';
import type { Task } from '../types/task'; // Assuming you have a Task type defined in types/task.ts
import TaskSidebar from './TaskSidebar';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';

const MODAL_STYLES: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'white',
    padding: '50px',
    borderRadius: '10px',
    zIndex: 1000,
    minWidth: '500px'
};
const OVERLAY_STYLES: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000
}

function TaskModal({node, onClose}: {node: Node; onClose: () => void;}) {
    const { teamInfo, isLoadingTeam, teamError } = useTeam();
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [tasks, setTasks] = useState<any[]>([]);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    // Always sort tasks after fetching
    const fetchTasks = async () => {
        setLoadingTasks(true);
        try {
            const res = await fetch(`http://localhost:3000/api/teams/${teamInfo?.team_id}/${node.id}/tasks`, {
                method: 'GET',
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to fetch tasks');
            const data = await res.json();
            setTasks(data.sort((a: Task, b: Task) => a.task_order - b.task_order));
            console.log('Fetched tasks:', data);
        } catch (err) {
            console.error('Error fetching tasks:', err);
        } finally {
            setLoadingTasks(false);
        }
    };

    // Save order and update local state
    const saveTaskOrder = async (orderedTasks: any[]) => {
        if (!teamInfo || !teamInfo.team_id) {
            console.error('Team information is not available.');
            return;
        }
        try {
            const res = await fetch(`http://localhost:3000/api/teams/${teamInfo.team_id}/${node.id}/tasks/order`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    tasks: orderedTasks.map((task, idx) => ({
                        task_id: task.task_id,
                        task_order: idx
                    }))
                }),
            });
            if (res.ok) {
                console.log('Task order saved successfully');
            } else {
                console.error('Failed to save task order:', await res.text());
            }
        } catch (err) {
            console.error('Failed to save task order:', err);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [teamInfo, node?.id]);

    const sensors = useSensors(
        useSensor(PointerSensor)
    );

    const handleDragEnd = (event: any) => {
        const {active, over} = event;
        if (active.id !== over?.id) {
            const oldIndex = tasks.findIndex(t => t.task_id === active.id);
            const newIndex = tasks.findIndex(t => t.task_id === over.id);
            const newTasks = arrayMove(tasks, oldIndex, newIndex);
            // Sort by new array order and update task_order
            setTasks(newTasks.map((task, idx) => ({ ...task, task_order: idx })));
            saveTaskOrder(newTasks);
        }
    };

    const handleDeleteTask = async (task_id: string) => {
        console.log("Delete clicked for", task_id);
        if (!teamInfo || !teamInfo.team_id) {
            console.error('Team information is not available.');
            return;
        }
        try {
            const res = await fetch(`http://localhost:3000/api/teams/${teamInfo.team_id}/${node.id}/tasks/${task_id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (res.ok) {
                // Refetch tasks
                const refreshed = await fetch(`http://localhost:3000/api/teams/${teamInfo.team_id}/${node.id}/tasks`, {
                    method: 'GET',
                    credentials: 'include'
                });
                const data = await refreshed.json();
                // Reassign task_order
                const reordered = data
                    .sort((a: Task, b: Task) => a.task_order - b.task_order)
                    .map((task: Task, idx: number) => ({ ...task, task_order: idx }));
                setTasks(reordered);
                // Persist new order to backend
                saveTaskOrder(reordered);
            } else {
                console.error('Failed to delete task:', await res.text());
            }
        } catch (err) {
            console.error('Error deleting task:', err);
        }
    };

    const portalRoot = document.getElementById('portal');
    if (!portalRoot) return null;

    if (isLoadingTeam) {
        return <div className="team-loading">Loading team information...</div>;
    }
    if (teamError) {
        return <div className="team-error">Error: {teamError}</div>;
    }
    if (!teamInfo) {
        return <div className="team-not-found">Team not found or no information available.</div>;
    }

    return createPortal(
        <>  
            <div style={OVERLAY_STYLES} />
            <div className="task-modal" style={MODAL_STYLES}>
                <div
                    style={{
                        textAlign: "center",
                        fontSize: "2rem",
                        fontWeight: 700,
                        marginBottom: "32px"
                    }}
                >{node.data.label}</div>
                {loadingTasks ? (
                    <div style={{ textAlign: "center", marginBottom: "24px" }}>Loading tasks...</div>
                ) : tasks.length === 0 ? (
                    <div style={{ textAlign: "center", marginBottom: "24px", color: "#888" }}>No tasks yet</div>
                ) : teamInfo.is_user_coach ? (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={tasks.map(t => t.task_id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {tasks
                                .slice()
                                .sort((a, b) => a.task_order - b.task_order)
                                .map(task => (
                                    <SortableTask 
                                        key={task.task_id} 
                                        task={task} 
                                        id={task.task_id} 
                                        onDelete={() => handleDeleteTask(task.task_id)}
                                        onSelect={() => setSelectedTask(task)}
                                    />
                                ))
                            }
                        </SortableContext>
                    </DndContext>
                ) : (
                    tasks
                        .slice()
                        .sort((a, b) => a.task_order - b.task_order)
                        .map(task => (
                            <div
                                key={task.task_id}
                                onClick={() => setSelectedTask(task)}
                                style={{
                                    background: "#f5f5f5",
                                    borderRadius: "6px",
                                    padding: "16px",
                                    marginBottom: "12px",
                                    minWidth: "250px",
                                    maxWidth: "500px",
                                    minHeight: "60px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    boxSizing: "border-box",
                                    cursor: "pointer"
                                }}
                            >
                                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 500 }}>{task.title}</h3>
                                <input type="checkbox" style={{ marginLeft: "16px" }} />
                            </div>
                        ))
                )}
                {teamInfo.is_user_coach && (
                    <AddNewTaskButton node={node} taskCount={tasks.length} onTaskAdded={fetchTasks}/>
                )}
                <button onClick={onClose}>Close</button>
            </div>
            {/* Sidebar for selected task */}
            {selectedTask && (
                <TaskSidebar task={selectedTask} onClose={() => setSelectedTask(null)} />
            )}
        </>,
        portalRoot
    )
}

export default TaskModal;