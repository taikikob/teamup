import { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';

type User = {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
};

type UserContextType = {
  user: User | null; // TODO: Replace this with user type once we have everything we need
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
};

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider: React.FC<{ children: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch('http://localhost:3000/api/auth/me', {
        credentials: 'include', // IMPORTANT: ensures cookies/session are sent
    })
        .then(async res => {
        if (!res.ok) throw new Error('Not authenticated');
        const data = await res.json();
        setUser(data);
        })
        .catch(() => setUser(null));
    }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
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