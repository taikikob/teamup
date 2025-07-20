// filepath: /Users/taikik/src/virtrain/frontend/src/pages/teamPages/CustomNode.tsx
import React, { useState } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { useTeam } from "../contexts/TeamContext";

const CustomNode: React.FC<NodeProps> = ({ data, selected }) => {
    const { teamInfo } = useTeam(); // Consume the context
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
        {/* Only show if the user is a coach */}
        {teamInfo?.is_user_coach && data.editing && (
            <>
                {/* Target handle (top) */}
                <Handle type="target" position={Position.Top} />
                {/* Source handle (bottom) */}
                <Handle type="source" position={Position.Bottom} />  
            </>
        )}
    </div>
  );
};

export default CustomNode;