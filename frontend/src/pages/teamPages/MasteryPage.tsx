import { useTeam } from "../../contexts/TeamContext";
import ReactFlow, { Background, Controls, applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';
import type { Node, Edge, Connection, NodeChange, EdgeChange } from 'reactflow';
import 'reactflow/dist/style.css';
import { useState, useCallback } from 'react';
import CustomNode from "../../components/CustomNode";
import CustomEdge from "../../components/CustomEdge";

const nodeTypes = {
  custom: CustomNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

function MasteryPage() {
    const { teamInfo, isLoadingTeam, teamError } = useTeam(); // Consume the context

    // send back request with team ID to backend to get mastery map data
    // This is a placeholder, you would replace this with actual data fetching logic

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

    // Use state for nodes and edges
    const [nodes, setNodes] = useState<Node[]>([
        {
            id: '1',
            position: { x: 0, y: 0 },
            data: { label: 'Start Node' },
            type: 'custom',
        },
        {
            id: '2',
            position: { x: 0, y: 100 },
            data: { label: 'End Node' },
            type: 'custom',
        },
    ]);
    const [edges, setEdges] = useState<Edge[]>([
        { id: 'e1-2', source: '1', target: '2', type: 'custom', label: 'Custom Edge'},
    ]);

    // Handlers for React Flow
    const onNodesChange = useCallback(
        (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    );
    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );

    const onConnect = useCallback(
    (params: Connection) =>
        setEdges((eds) =>
            addEdge({ ...params, type: 'custom', label: 'Custom Edge' }, eds)
        ),
    []
    );

    // Add node handler
    const addNode = () => {
        const newId = (nodes.length + 1).toString();
        setNodes((nds) => [
            ...nds,
            {
                id: newId,
                position: { x: Math.random() * 200, y: Math.random() * 200 },
                data: { label: `Node ${newId}` },
                type: 'custom',
            },
        ]);
    };

    const isCoach = teamInfo.is_user_coach; // Check if the user is a coach

    return (
        <>
            <h1>Mastery Map</h1>
            <button onClick={addNode} style={{ marginBottom: 12 }}>Add Node</button>
            <button></button>
            <div style={{ width: '100%', height: '700px', border: '1px solid #ccc', borderRadius: 8 }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    fitView
                    panOnScroll={true}
                    selectionOnDrag={isCoach}
                    nodesDraggable={isCoach}
                    nodesConnectable={isCoach}
                    elementsSelectable={isCoach}
                    panOnDrag={false}
                >
                    <Background />
                    <Controls />
                </ReactFlow>
            </div>
        </>
    )
}

export default MasteryPage;