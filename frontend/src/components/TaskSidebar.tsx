import React from "react";
import type { Task } from "../types/task";

const SIDEBAR_STYLES: React.CSSProperties = {
  position: "fixed",
  top: 0,
  right: 0,
  width: "1000px",
  height: "100%",
  background: "#fff",
  boxShadow: "-2px 0 8px rgba(0,0,0,0.1)",
  zIndex: 1100,
  padding: "32px",
  overflowY: "auto"
};

function TaskSidebar({ task, onClose }: { task: Task; onClose: () => void }) {
  if (!task) return null;
  return (
    <div style={SIDEBAR_STYLES}>
      <h2>{task.title}</h2>
      <p>{task.description}</p>
      {/* Example for resources: */}
      <p>Resources would go here</p>
      {/* {task.resources && task.resources.map((res: any, idx: number) => (
        <div key={idx} style={{ marginBottom: "16px" }}>
          {res.type === "image" && <img src={res.url} alt="Resource" style={{ maxWidth: "100%" }} />}
          {res.type === "video" && (
            <video controls style={{ maxWidth: "100%" }}>
              <source src={res.url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      ))} */}
      <button
        style={{
          marginTop: "24px",
          background: "#e74c3c",
          color: "white",
          border: "none",
          borderRadius: "6px",
          padding: "8px 16px",
          cursor: "pointer",
          fontWeight: 500
        }}
        onClick={onClose}
      >
        Close
      </button>
    </div>
  );
}

export default TaskSidebar;