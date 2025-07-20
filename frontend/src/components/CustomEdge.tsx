import React from "react";
import { getBezierPath } from "reactflow";
import type { EdgeProps } from "reactflow";

const CustomEdge: React.FC<EdgeProps> = ({
  id, sourceX, sourceY, targetX, targetY, selected
}) => {
  const [edgePath] = getBezierPath({ sourceX, sourceY, targetX, targetY });
  const markerId = `arrowhead-${id}`;

  return (
    <>
      <svg style={{ position: 'absolute', overflow: 'visible' }}>
        <defs>
          <marker
            id={markerId}
            markerWidth="4"
            markerHeight="4"
            refX="4"
            refY="2"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L4,2 L0,4 Z" fill="#222" />
          </marker>
        </defs>
        <path
          d={edgePath}
          stroke="#222"
          strokeWidth={2}
          fill="none"
          markerEnd={`url(#${markerId})`}
          strokeDasharray={selected ? "6,4" : undefined}
          style={{ pointerEvents: 'all' }} // <-- Enable pointer events for selection
        />
      </svg>
    </>
  );
};

export default CustomEdge;