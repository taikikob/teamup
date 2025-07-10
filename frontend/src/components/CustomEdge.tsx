import React from "react";
import { getBezierPath } from "reactflow";
import type { EdgeProps } from "reactflow";

const CustomEdge: React.FC<EdgeProps> = ({
  id, sourceX, sourceY, targetX, targetY, label
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY });
  const markerId = `arrowhead-${id}`;

  return (
    <>
      <svg style={{ position: 'absolute', overflow: 'visible', pointerEvents: 'none' }}>
        <defs>
          <marker
            id={markerId}
            markerWidth="8"
            markerHeight="8"
            refX="8"         // tip of the triangle at the end of the path
            refY="4"
            orient="auto"
            markerUnits="strokeWidth"
          >
            {/* Right-pointing triangle */}
            <path d="M0,0 L8,4 L0,8 Z" fill="#222" />
          </marker>
        </defs>
        <path
          d={edgePath}
          stroke="#222"
          strokeWidth={2}
          fill="none"
          markerEnd={`url(#${markerId})`}
        />
      </svg>

    </>
  );
};

export default CustomEdge;