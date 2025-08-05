import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Need useParams here to get team_id
import { useUser } from './UserContext'; // Assuming you still need user for auth
import { toast } from 'react-toastify'; 

interface CoachInfo {
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    profile_picture_link: string | null;
}

interface PlayerInfo {
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    profile_picture_link: string | null;
}

interface AccessCodeInfo {
    code: string;
    role: 'Player' | 'Coach';
    expires_at: string;
}

interface TeamInfo {
    team_id: number;
    team_name: string;
    team_description: string | null;
    is_user_coach: boolean;
    players_info: PlayerInfo[];
    coaches_info: CoachInfo[];
    team_access_codes: AccessCodeInfo[];
}

interface TeamContextType {
    teamInfo: TeamInfo | null;
    isLoadingTeam: boolean;
    teamError: string | null;
    updateTeamName: (newName: string) => Promise<void>;
    refreshTeamInfo: () => void; // Optional: A way to re-fetch on demand
}

// Create the context
const TeamContext = createContext<TeamContextType | undefined>(undefined);

// Create the provider component
interface TeamProviderProps {
    children: ReactNode;
}

export const TeamProvider: React.FC<TeamProviderProps> = ({ children }) => {
    const { team_id: teamIdParam } = useParams<{ team_id: string }>(); // Get team_id from URL
    const team_id = parseInt(teamIdParam || '', 10); // Parse to number
    const { user } = useUser(); // Get user from your existing UserContext
    const navigate = useNavigate(); // Get the navigate function here!

    const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
    const [isLoadingTeam, setIsLoadingTeam] = useState<boolean>(true);
    const [teamError, setTeamError] = useState<string | null>(null);

    const fetchTeamData = async () => {
        try {
            setIsLoadingTeam(true);
            setTeamError(null);

            const res = await fetch(`http://localhost:3000/api/teams/${team_id}`, {
                credentials: 'include',
            });

            if (!res.ok) {
                const errorResponse = await res.json();
                if (res.status === 401) {
                    setTeamError("You are not logged in. Please log in.");
                    // You might want to handle navigation to login here or in the consuming component
                    navigate('/login', { replace: true }); // Use { replace: true } to prevent going back to the protected page
                } else if (res.status === 404) {
                    setTeamError("Team not found.");
                } else if (res.status === 403) {
                    // Only show the toast if the error is not already set
                    if (!teamError) {
                        setTeamError("You do not have permission to view this team.");
                        toast.error("You are not a member of this team.", {
                            position: "top-center",
                            toastId: "not-a-member" // <-- unique ID prevents duplicates
                        });
                        navigate("/home", { replace: true });
                    }
                } else {
                    throw new Error(errorResponse.message || `HTTP error! Status: ${res.status}`);
                }
            } else {
                const data: TeamInfo = await res.json();
                console.log("Fetched team data:", data);
                setTeamInfo(data);
            }
        } catch (err: any) {
            console.error("Failed to fetch team information:", err);
            setTeamError(err.message || "An unexpected error occurred.");
        } finally {
            setIsLoadingTeam(false);
        }
    };
        
    useEffect(() => {
        fetchTeamData();
    }, [team_id, user?.user_id]); // Re-fetch if team_id or user changes

    const updateTeamName = async (newName: string) => {
        if (!teamInfo || !teamInfo.team_id) {
            throw new Error("Team information is not available.");
        }
        try {
            const res = await fetch(`http://localhost:3000/api/teams/${teamInfo.team_id}/name`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ team_name: newName }),
            });
            if (!res.ok) {
                throw new Error("Failed to update team name");
            }
            refreshTeamInfo();
            const successMessage = await res.json();
            toast.success(successMessage.message, { position: "top-center" });
        } catch (error) {
            console.error("Error updating team name:", error);
            toast.error("Failed to update team name. Please try again.", { position: "top-center" });
        }
    };

    // Provide a way to refresh the data if needed (e.g., after an update)
    const refreshTeamInfo = () => {
        fetchTeamData();
    };

    const contextValue: TeamContextType = {
        teamInfo,
        isLoadingTeam,
        teamError,
        updateTeamName,
        refreshTeamInfo,
    };

    return (
        <TeamContext.Provider value={contextValue}>
            {children}
        </TeamContext.Provider>
    );
}

// Custom hook to consume the context
export const useTeam = () => {
    const context = useContext(TeamContext);
    if (context === undefined) {
        throw new Error('useTeam must be used within a TeamProvider');
    }
    return context;
};