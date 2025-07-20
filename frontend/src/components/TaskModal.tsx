import type { Node } from 'reactflow';
import { createPortal } from 'react-dom';
import { useTeam } from "../contexts/TeamContext";
import { useState, useEffect } from 'react';
import AddNewTaskButton from './AddNewTaskButton';

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
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';

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

function SortableTask({task, id}: {task: any, id: string}) {
  const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({id});
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
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
        cursor: "grab",
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
      }}
    >
      <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 500 }}>{task.title}</h3>
      <input type="checkbox" style={{ marginLeft: "16px" }} />
    </div>
  );
}

function TaskModal({node, onClose}: {node: Node; onClose: () => void;}) {
    const { teamInfo, isLoadingTeam, teamError } = useTeam(); // Consume the context
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [tasks, setTasks] = useState<any[]>([]); // Use any[] for flexibility

    const fetchTasks = async () => {
        setLoadingTasks(true);
        try {
            const res = await fetch(`http://localhost:3000/api/teams/${teamInfo?.team_id}/${node.id}/tasks`, {
                method: 'GET',
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to fetch tasks');
            const data = await res.json();
            setTasks(data);
        } catch (err) {
            console.error('Error fetching tasks:', err);
        } finally {
            setLoadingTasks(false);
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
            const oldIndex = tasks.findIndex(t => t.taskId === active.id);
            const newIndex = tasks.findIndex(t => t.taskId === over.id);
            setTasks(arrayMove(tasks, oldIndex, newIndex));
        }
    };

    const portalRoot = document.getElementById('portal');
    if (!portalRoot) return null; // Don't render if portal root is missing

    // conditional rendering
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
                            items={tasks.map(t => t.taskId)}
                            strategy={verticalListSortingStrategy}
                        >
                            {tasks.map(task => (
                                <SortableTask key={task.taskId} task={task} id={task.taskId} />
                            ))}
                        </SortableContext>
                    </DndContext>
                ) : (
                    tasks.map(task => (
                        <div
                            key={task.taskId}
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
                                cursor: "default"
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
        </>,
        portalRoot
    )
}

export default TaskModal;