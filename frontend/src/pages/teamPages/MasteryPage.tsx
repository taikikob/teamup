import { useTeam } from "../../contexts/TeamContext";
import ReactFlow, { useNodesState, useEdgesState, Background, Controls, applyNodeChanges, applyEdgeChanges, addEdge, BackgroundVariant } from 'reactflow';
import type { Node, Edge, Connection, NodeChange, EdgeChange } from 'reactflow';
import 'reactflow/dist/style.css';
import { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
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
    const [nodes, setNodes] = useNodesState([]);
    const [edges, setEdges] = useEdgesState([]);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const saveTimeoutRef = useRef<number | null>(null); // To store the debounce timer

    // Function to save flow data to backend
    const saveFlowToBackend = useCallback(async (currentNodes: Node[], currentEdges: Edge[]) => {
        setSaveError(null); // Reset error before saving
        try {
            const response = await fetch(`http://localhost:3000/api/teams/${teamInfo?.team_id}/flow`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ nodes: currentNodes, edges: currentEdges }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMsg = errorData.error || `Failed to save flow data (status ${response.status})`;
                setSaveError(errorMsg);
                console.error("Save error:", errorMsg);
                return;
            }
            setLastSaved(new Date());
            console.log("Flow data saved successfully.");
        } catch (error: any) {
            setSaveError(error?.message || "Network error while saving flow data.");
            console.error("Error saving flow data:", error);
        } finally {
            setIsSaving(false);
        }
    }, [teamInfo?.team_id]);

    useEffect(() => {
        if (!teamInfo?.is_user_coach) return; // Only allow coaches to save

        // Clear any existing save timer
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Set a new timer to save after a dalay
        // Capture the current state of nodes and edges for the save function
        setIsSaving(true);
        const currentNodes = nodes;
        const currentEdges = edges;

        saveTimeoutRef.current = setTimeout(() => {
            saveFlowToBackend(currentNodes, currentEdges);
        }, 2000) as unknown as number; // 2 second delay

        // Cleanup function: clear timeout if component unmounts or effect re-runs
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [nodes, edges, saveFlowToBackend, teamInfo?.is_user_coach]);

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
                // Remove all edges connected to this node
                setEdges(eds => eds.filter(e => e.source !== removeChange.id && e.target !== removeChange.id));
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
        (params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'custom' }, eds)),
        [setEdges]
    );

    // Add node handler
    const addNode = () => {
        const newId = uuidv4(); // Generate a unique ID for the new node
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

    const handleCloseEditing = () => {
        setEditing(false);
        // Optionally save the flow here if needed
    };

    const updateNodeLabel = async (nodeId: string, newLabel: string) => {
        if (!teamInfo?.team_id) {
            console.error("No team ID available for updating node label");
            return;
        }
        // Update local state
        setNodes(nds =>
            nds.map(node =>
                node.id === nodeId
                    ? { ...node, data: { ...node.data, label: newLabel } }
                    : node
            )
        );

        // Send update to backend
        try {
            const res = await fetch(`http://localhost:3000/api/teams/${teamInfo.team_id}/node-label`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ node_id: nodeId, label: newLabel }),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error("Failed to update node label:", errorData.error || res.statusText);
            }
        } catch (error) {
            console.error("Network error updating node label:", error);
        }
    };

    // Initial load of nodes/edges happens here
    useEffect(() => {
        if (!teamInfo?.team_id) return; // Guard: only fetch if team_id exists
        // Fetch nodes and edges for the current team from backend
        const fetchFlowData = async () => {
            try {
                setLoading(true);
                // Make a request to backend to fetch flow data
                const res = await fetch(`http://localhost:3000/api/teams/${teamInfo.team_id}/flow`, {
                    method: 'GET',
                    credentials: 'include'
                });
                if (res.status === 200) {
                    const data = await res.json();
                    console.log("Fetched flow data:", data);
                    console.log("First node:", data.nodes[0]);
                    setNodes(data.nodes);
                    setEdges(data.edges);
                }
            } catch (error) {
                console.error('Error fetching team flow data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchFlowData();
    }, [teamInfo?.team_id]);

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

    const nodesWithCallback = nodes.map(node => ({
        ...node,
        data: {
            ...node.data,
            updateNodeLabel,
            id: node.id, // pass id for CustomNode
            editing
        }
    }));

    return (
        <>
            <h1>Mastery Map</h1>
            {teamInfo.is_user_coach && (
                <div style={{ marginBottom: 12, display: 'flex', gap: '8px' }}> {/* Added flex and gap for buttons */}
                    {editing ? (
                        <>
                            <button onClick={addNode}>Add Node</button>
                            {/* Changed Close to simply exit editing */}
                            <button onClick={handleCloseEditing}>Done</button>
                        </>
                    ) : (
                        <button onClick={() => setEditing(true)}>Edit Map</button>
                    )}
                </div>
            )}
            {/* Display auto-save status below buttons */}
            <div style={{ marginBottom: 10, minHeight: '20px' }}>
                {teamInfo.is_user_coach && editing && (
                    isSaving ? (
                        <span style={{ color: 'orange' }}>Saving...</span>
                    ) : (
                        lastSaved && <span style={{ color: 'green' }}>Saved at {lastSaved.toLocaleTimeString()}</span>
                    )
                )}
            </div>
            {/* Add error message display here */}
            {saveError && <div style={{ color: 'red', marginBottom: 8 }}>{saveError}</div>}
            <div style={{ width: '100%', height: '700px', border: '1px solid #ccc', borderRadius: 8, position: 'relative' }}>
                {/* Loading overlay for nodes/edges */}
                {loading && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 100,
                        background: 'rgba(255,255,255,0.9)',
                        padding: '32px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}>
                        <span style={{ fontSize: '1.2rem', color: '#333' }}>Loading map...</span>
                    </div>
                )}
                <ReactFlow
                    nodes={nodesWithCallback}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    fitView
                    panOnScroll={true}
                    selectionOnDrag={teamInfo.is_user_coach && editing}
                    nodesDraggable={teamInfo.is_user_coach && editing}
                    nodesConnectable={teamInfo.is_user_coach && editing}
                    elementsSelectable={teamInfo.is_user_coach && editing}
                    onNodeClick={(_, node) => {
                        if (teamInfo.is_user_coach && editing) {
                            return;
                        }
                        handleNodeClick(node.id);
                    }}
                    panOnDrag={false}
                >
                    {editing ? (
                        <Background variant={BackgroundVariant.Lines} color="#e0e0e0" gap={16} />
                    ) : (
                        <Background variant={BackgroundVariant.Dots} color="#a0a0a0" gap={16} size={1} />
                    )}
                    <Controls />
                </ReactFlow>
                {openModalId && modalNode && (
                    <LevelModal
                        node={modalNode}
                        onClose={handleCloseModal}
                    />
                )}
            </div>
        </>
    );
}

export default MasteryPage;