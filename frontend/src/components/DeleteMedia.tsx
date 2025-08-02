import { useState } from 'react';
import { toast } from 'react-toastify';
import { useTeam } from '../contexts/TeamContext';

function DeleteMedia({ postId, refetch }: { postId: number; refetch: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { teamInfo } = useTeam();

    const handleOpen = () => {
        setLoading(false);
        setIsOpen(true);
    };

    const handleClose = () => {
        setLoading(false);
        setIsOpen(false);
    };

    const handleDelete = async (id: number) => {
        if (!teamInfo) {
            console.error("Team information is not available.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:3000/api/posts/${teamInfo.team_id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ postId: id }),
            });
            if (!res.ok) {
                let errorMsg = 'Failed to delete media';
                // Only try to parse JSON if not 204 and content exists
                if (res.status !== 204) {
                    try {
                        const data = await res.json();
                        errorMsg = data.message || errorMsg;
                    } catch {}
                }
                throw new Error(errorMsg);
            }
            toast.success('Media deleted successfully', { position: 'top-center' });
            refetch();
            setIsOpen(false);
        } catch (error) {
            console.error("Error deleting post:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'inline-block' }}>
            <button
                onClick={e => {
                    e.stopPropagation();
                    handleOpen();
                }}
                style={{
                    background: "#e74c3c",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    cursor: "pointer",
                    fontWeight: 500
                }}
            >
                Delete
            </button>

            {isOpen && (
                <div style={overlayStyles}>
                    <div style={modalStyles}>
                        <h2>Delete Media</h2>
                        <p>Are you sure you want to delete this?</p>
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                handleDelete(postId);
                            }}
                            disabled={loading}
                            style={{
                                background: "#e74c3c",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                padding: "8px 16px",
                                cursor: loading ? "not-allowed" : "pointer",
                                fontWeight: 500,
                                marginTop: "12px"
                            }}
                        >
                            {loading ? 'Deleting...' : 'Delete Media'}
                        </button>
                        <br />
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                handleClose();
                            }}
                            style={{
                                marginTop: "8px"
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

const overlayStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
};

const modalStyles: React.CSSProperties = {
    background: '#fff',
    padding: '2rem',
    borderRadius: '8px'
};

export default DeleteMedia;