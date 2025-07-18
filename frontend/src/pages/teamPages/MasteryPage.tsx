import { useTeam } from "../../contexts/TeamContext";
import ReactFlow, { Background, Controls, applyNodeChanges, applyEdgeChanges, addEdge, BackgroundVariant } from 'reactflow';
import type { Node, Edge, Connection, NodeChange, EdgeChange } from 'reactflow';
import 'reactflow/dist/style.css';
import { useState, useCallback } from 'react';
import CustomNode from "../../components/CustomNode";
import CustomEdge from "../../components/CustomEdge";
import LevelModal from "../../components/LevelModal";

const nodeTypes = {
    custom: CustomNode
};

const edgeTypes = {
    custom: CustomEdge
};

function MasteryPage() {
    const { teamInfo, isLoadingTeam, teamError } = useTeam(); // Consume the context
    const [openModalId, setOpenModalId] = useState<string | null>(null);
    // send back request with team ID to backend to get mastery map data
    // This is a placeholder, you would replace this with actual data fetching logic

    // Use state for nodes and edges
    const [editing,setEditing] = useState(false);
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
        { id: 'e1-2', source: '1', target: '2', type: 'custom'},
    ]);

    // Handlers for React Flow
    const onNodesChange = useCallback(
        (changes: NodeChange[]) => {
        // Check if any change is a remove
        const removeChange = changes.find(change => change.type === 'remove');
        if (removeChange && !editing) {
            return; // If not editing, do not allow node removal
        }
        if (removeChange && teamInfo?.is_user_coach) {
        // Show confirmation dialog for coaches
            console.log("Node removal detected:", removeChange);
            if (window.confirm("Are you sure you want to delete this node?")) {
                setNodes(nds => applyNodeChanges(changes, nds));
            }
            // If not confirmed, do nothing (node will not be deleted)
            return;
        }
        // For other changes, apply as usual
        setNodes(nds => applyNodeChanges(changes, nds));
        },
        [teamInfo?.is_user_coach, editing]
    );
    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => {
            const removeChange = changes.find(change => change.type === 'remove');
            if (removeChange && !editing) {
                return; // If not editing, do not allow edge removal
            }
            setEdges((eds) => applyEdgeChanges(changes, eds));
        },
        []
    );

    const onConnect = useCallback(
    (params: Connection) =>
        setEdges((eds) =>
            addEdge({ ...params, type: 'custom'}, eds)
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

    // To open a modal for a node:
    const handleNodeClick = (nodeId: string) => {
        setOpenModalId(nodeId);
    };

    // To close the modal:
    const handleCloseModal = () => {
        setOpenModalId(null);
    };

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

    const modalNode = nodes.find(n => n.id === openModalId);

    return (
        <>
            <h1>Mastery Map</h1>
            {teamInfo?.is_user_coach && (
                editing ? (
                    <>
                        <button onClick={addNode} style={{ marginBottom: 12 }}>Add Node</button>
                        <button onClick={() => setEditing(false)} style={{ marginBottom: 12 }}>Save</button>
                        <button onClick={() => setEditing(false)}>Close</button>
                    </>
                ) : (
                    <button onClick={() => setEditing(true)} style={{ marginBottom: 12 }}>Edit</button>
                )
            )}
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
                    selectionOnDrag={teamInfo?.is_user_coach}
                    nodesDraggable={teamInfo?.is_user_coach && editing}
                    nodesConnectable={teamInfo?.is_user_coach && editing}
                    elementsSelectable={teamInfo?.is_user_coach && editing}
                    onNodeClick={(event, node) => {
                        // open a modal
                        if (teamInfo?.is_user_coach && editing) {
                            return; // Do not open modal if editing
                        }
                        handleNodeClick(node.id);
                    }}
                    panOnDrag={false}
                >
                    {editing ? (
                        <Background variant={BackgroundVariant.Lines}/>
                    ) : (
                        <Background variant={BackgroundVariant.Dots}/>
                    )}
                    <Controls />
                </ReactFlow>
                {/* Render modal here, outside ReactFlow but inside the map container */}
                {openModalId && modalNode && (
                    <LevelModal
                        node={modalNode}
                        onClose={handleCloseModal}
                    />
                )}
            </div>
        </>
    )
}

export default MasteryPage;