import { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';

type User = {
  user_id: number;
  email: string | null; // Email is optional, can be null
  username: string;
  first_name: string;
  last_name: string;
  notifications_enabled: boolean;
  profile_picture_link: string | null;
};

type UserContextType = {
  user: User | null;
  isLoadingUser: boolean;
  refreshUser: () => Promise<void>;
  uploadProfilePicture: (file: Blob) => Promise<void>;
};
const UserContext = createContext<UserContextType | null>(null);

export const UserProvider: React.FC<{ children: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true); // Start as true since we fetch on mount

  // This function encapsulates the logic to fetch the current user's status
  const fetchCurrentUser = async () => {
    setIsLoadingUser(true); // Set loading to true before fetching
    try {
      const res = await fetch('https://teamup-five.vercel.app/api/auth/me', {
          credentials: 'include', // IMPORTANT: ensures cookies/session are sent
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Fetched user data:", data);
        setUser(data); // Set user data if successful
      } else {
        // If response is not OK (e.g., 401 Not Authenticated), set user to null
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch user status:", error);
      setUser(null); // Set user to null on network errors as well
    } finally {
      setIsLoadingUser(false); // Set loading to false after fetch completes (success or failure)
    }
  };

  // Call the fetch function once on initial component mount
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // This is the function that other components will call to force a refresh
  const refreshUser = async () => {
    await fetchCurrentUser(); // Just re-run the fetch logic
  };

  const uploadProfilePicture = async (file: Blob) => {
    const formData = new FormData();
    formData.append("profile_picture", file, "profile.jpg");
    try {
      const res = await fetch("https://teamup-five.vercel.app/api/posts/pp", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload profile picture");
      await fetchCurrentUser(); // Refresh user info to get new profile_picture_link
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  return (
    <UserContext.Provider value={{ user, isLoadingUser, refreshUser, uploadProfilePicture }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser must be used with in a UserProvider");
    }
    return context;
};