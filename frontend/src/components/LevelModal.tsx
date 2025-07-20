import type { Node } from 'reactflow';
import { createPortal } from 'react-dom';
import { useTeam } from "../contexts/TeamContext";
import { useState } from 'react';

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

function SortableLevel({level, id}: {level: any, id: string}) {
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
      <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 500 }}>{level.title}</h3>
      <input type="checkbox" style={{ marginLeft: "16px" }} />
    </div>
  );
}

function LevelModal({node, onClose}: {node: Node; onClose: () => void;}) {
    const { teamInfo, isLoadingTeam, teamError } = useTeam(); // Consume the context
    
    // placeholder level data
    const [levels, setLevels] = useState([
        { levelId: '1', title: 'Juggle 5 times with right feet'},
        { levelId: '2', title: 'Juggle 5 times with left feet'},
        { levelId: '3', title: 'Juggle 5 times with both feet'},
        { levelId: '4', title: 'Juggle 5 times with right thigh'}
    ]);

    const sensors = useSensors(
        useSensor(PointerSensor)
    );

    const handleDragEnd = (event: any) => {
        const {active, over} = event;
        if (active.id !== over?.id) {
            const oldIndex = levels.findIndex(l => l.levelId === active.id);
            const newIndex = levels.findIndex(l => l.levelId === over.id);
            setLevels(arrayMove(levels, oldIndex, newIndex));
        }
    };

    const portalRoot = document.getElementById('portal');
    if (!portalRoot) return null; // Don't render if portal root is missing
    
    // Make a request to backend to fetch level data based on node.id and team.id


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
            <div className="level-modal" style={MODAL_STYLES}>
                <div
                    style={{
                        textAlign: "center",
                        fontSize: "2rem",
                        fontWeight: 700,
                        marginBottom: "32px"
                    }}
                >{node.data.label}</div>
                {teamInfo.is_user_coach ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={levels.map(l => l.levelId)}
                      strategy={verticalListSortingStrategy}
                    >
                      {levels.map(level => (
                        <SortableLevel key={level.levelId} level={level} id={level.levelId} />
                      ))}
                    </SortableContext>
                  </DndContext>
                ) : (
                  levels.map(level => (
                    <div
                      key={level.levelId}
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
                      <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 500 }}>{level.title}</h3>
                      <input type="checkbox" style={{ marginLeft: "16px" }} />
                    </div>
                  ))
                )}
                {teamInfo.is_user_coach && (
                    <button onClick={onClose} style={{ marginBottom: 12 }}>Add new task</button>
                )}
                <button onClick={onClose}>Close</button>
            </div>
        </>,
        portalRoot
    )
}

export default LevelModal;