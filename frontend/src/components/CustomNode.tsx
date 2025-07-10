// filepath: /Users/taikik/src/virtrain/frontend/src/pages/teamPages/CustomNode.tsx
import React, { useState } from "react";
import { Handle, Position, type NodeProps } from "reactflow";

const CustomNode: React.FC<NodeProps> = ({ data }) => {
    const [editing, setEditing] = useState(false);
    const [label, setLabel] = useState(data.label);

    const handleDoubleClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        setEditing(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLabel(e.target.value);
    };

    const handleBlur = () => {
        setEditing(false);
    };


  return (
        <div
            style={{ padding: 10, border: "2px solid #007bff", borderRadius: 8, background: "#e9f5ff" }}
            onDoubleClick={handleDoubleClick}
            >
        {editing ? (
            <>
                <input
                    type="text"
                    value={label}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoFocus
                    style={{ fontWeight: "bold", width: "100%" }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            handleBlur();
                        }
                    }}
                />
                <button onClick={handleBlur}>Save</button>
            </>
        ) : (
            <strong>{label}</strong>
        )}

        {/* Add more custom content here */}
        {/* Target handle (top) */}
        <Handle type="target" position={Position.Top} />
        {/* Source handle (bottom) */}
        <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default CustomNode;