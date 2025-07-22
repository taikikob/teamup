import { useTeam } from "../contexts/TeamContext";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DeleteNewTaskButton from "./DeleteNewTaskButton";
import type { Task } from '../types/task'; // Assuming you have a Task type defined in types/task.ts

function SortableTask({task, id, onDelete}: {task: Task, id: string, onDelete: () => void}) {
  const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({id});
  const { teamInfo } = useTeam(); // Moved here to access teamInfo

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
        cursor: "grab",
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
      }}
    >
      <h3
        {...attributes}
        {...listeners}
        style={{ margin: 0, fontSize: "1.1rem", fontWeight: 500, cursor: "grab" }}
      >
        {task.title}
      </h3>
      {/* Only show delete button for coach */}
      {teamInfo?.is_user_coach ? (
        <DeleteNewTaskButton task={task} handleDelete={onDelete} />
      ) :  <input type="checkbox" style={{ marginLeft: "16px" }} />}
    </div>
  );
}

export default SortableTask;