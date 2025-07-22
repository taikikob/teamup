import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../types/task'; // Assuming you have a Task type defined in types/task.ts
import DeleteNewTaskButton from './DeleteNewTaskButton';

function SortableTask({ task, id, onDelete, onSelect }: {
  task: Task;
  id: string;
  onDelete: () => void;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
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
        cursor: "pointer",
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
      }}
      onClick={e => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <span
        {...attributes}
        {...listeners}
        style={{
          cursor: "grab",
          marginRight: "12px",
          fontSize: "1.5rem",
          userSelect: "none"
        }}
        title="Drag to reorder"
        onClick={e => e.stopPropagation()} // Prevent sidebar open when dragging
      >
        &#9776;
      </span>
      <h3 
        style={
            { 
                marginLeft: 10, 
                marginRight: 10,
            }}>{task.title}</h3>
      <DeleteNewTaskButton
        task={task}
        handleDelete={onDelete}
      />
    </div>
  );
}

export default SortableTask;