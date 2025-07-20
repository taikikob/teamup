// filepath: /Users/taikik/src/virtrain/frontend/src/pages/teamPages/CustomNode.tsx
import React, { useState } from "react";
import { Handle, Position, type NodeProps } from "reactflow";

const CustomNode: React.FC<NodeProps> = ({ data, selected }) => {
    const [editingLabel, setEditingLabel] = useState(false);
    const [label, setLabel] = useState(data.label);

    const handleDoubleClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        setEditingLabel(true);
        console.log("Double click detected, entering edit mode");
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLabel(e.target.value);
    };

    const handleSave = () => {
        console.log("Saving label for node:", data.id, label);
        if (data.updateNodeLabel) {
            data.updateNodeLabel(data.id, label);
        }
        setEditingLabel(false);
    };

  return (
        <div
            style={{
                padding: 10,
                border: selected ? "2px dotted #007bff" : "2px solid #007bff",
                borderRadius: 8,
                background: "#e9f5ff"
            }}
            onDoubleClick={handleDoubleClick}
        >
        {editingLabel ? (
            <>
                <input
                    type="text"
                    value={label}
                    onChange={handleChange}
                    autoFocus
                    style={{ fontWeight: "bold", width: "100%" }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            handleSave();
                        }
                    }}
                />
                <button onClick={handleSave}>Save</button>
            </>
        ) : (
            <strong>{label}</strong>
        )}

        {/* Add more custom content here */}
        <>
            {/* Target handle (top) */}
            <Handle
                type="target"
                position={Position.Top}
                isConnectable={data.editing && data.isCoach}
                style={{
                    opacity: data.editing && data.isCoach ? 1 : 0, // Invisible when not editing as coach
                    pointerEvents: data.editing && data.isCoach ? 'auto' : 'none' // Prevent interaction when invisible
                }}
            />
            {/* Source handle (bottom) */}
            <Handle
                type="source"
                position={Position.Bottom}
                isConnectable={data.editing && data.isCoach}
                style={{
                    opacity: data.editing && data.isCoach ? 1 : 0,
                    pointerEvents: data.editing && data.isCoach ? 'auto' : 'none'
                }}
            />  
        </>
    </div>
  );
};

export default CustomNode;