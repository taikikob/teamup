import React, { createContext, useContext, useState, useCallback } from "react";
import type { PlayerSubmission } from "../types/playerSubmission";

type PlayerSubmissionsContextType = {
  playerSubmissions: PlayerSubmission[];
  loadingPlayerSubmissions: boolean;
  fetchPlayerSubmissions: (teamId: number, taskId: number) => Promise<void>;
  updatePlayerSubmission: (updated: PlayerSubmission) => void;
};

const PlayerSubmissionsContext = createContext<PlayerSubmissionsContextType | undefined>(undefined);

export const PlayerSubmissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playerSubmissions, setPlayerSubmissions] = useState<PlayerSubmission[]>([]);
  const [loadingPlayerSubmissions, setLoadingPlayerSubmissions] = useState(false);

  const fetchPlayerSubmissions = useCallback(async (teamId: number, taskId: number) => {
    setLoadingPlayerSubmissions(true);
    try {
      const res = await fetch(`http://localhost:3000/api/posts/playerSubmissions/${teamId}/${taskId}`, {
        credentials: 'include'
      });
      if (!res.ok) {
        console.error("Failed to fetch player submissions");
        setPlayerSubmissions([]);
        return;
      }
      const data = await res.json();
      setPlayerSubmissions(data);
    } catch (error) {
      console.error("Error fetching player submissions:", error);
      setPlayerSubmissions([]);
    } finally {
      setLoadingPlayerSubmissions(false);
    }
  }, []);

  const updatePlayerSubmission = (updated: PlayerSubmission) => {
    setPlayerSubmissions(prev =>
      prev.map(sub =>
        sub.user_id === updated.user_id && sub.task_id === updated.task_id
          ? updated
          : sub
      )
    );
  };

  return (
    <PlayerSubmissionsContext.Provider value={{
      playerSubmissions,
      loadingPlayerSubmissions,
      fetchPlayerSubmissions,
      updatePlayerSubmission
    }}>
      {children}
    </PlayerSubmissionsContext.Provider>
  );
};

export const usePlayerSubmissions = () => {
  const context = useContext(PlayerSubmissionsContext);
  if (!context) {
    throw new Error("usePlayerSubmissions must be used within a PlayerSubmissionsProvider");
  }
  return context;
};