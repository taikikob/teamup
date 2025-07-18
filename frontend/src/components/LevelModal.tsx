import type { Node } from 'reactflow';
import { createPortal } from 'react-dom';

const MODAL_STYLES: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'white',
    padding: '50px',
    borderRadius: '10px',
    zIndex: 1000
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

function LevelModal({node, onClose}: {node: Node; onClose: () => void;}) {
    const portalRoot = document.getElementById('portal');
    if (!portalRoot) return null; // Don't render if portal root is missing
    
    return createPortal(
        <>  
            <div style={OVERLAY_STYLES} />
            <div className="level-modal" style={MODAL_STYLES}>
                <div>Your Tasks for Node {node.id}</div>
                <div>Node Label: {node.data.label}</div>
                {/* For example, you can display tasks or other information */}
                <button onClick={onClose}>Close</button>
            </div>
        </>,
        portalRoot
    )
}

export default LevelModal;