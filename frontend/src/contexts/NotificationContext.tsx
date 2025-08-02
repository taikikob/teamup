import { createContext, useContext, useEffect, useState } from "react";
import type { notification } from "../types/notification";

type NotificationContextType = {
    notifications: notification[];
    unreadCount: number;
    loadingNotifications: boolean;
    fetchNotifications: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType>({
    notifications: [],
    unreadCount: 0,
    loadingNotifications: false,
    fetchNotifications: async () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingNotifications, setLoadingNotifications] = useState(false);

    const fetchNotifications = async () => {
        setLoadingNotifications(true);
        const response = await fetch("http://localhost:3000/api/notif", {
            credentials: "include"
        });
        if (response.ok) {
            const data = await response.json();
            setNotifications(data);
            setUnreadCount(data.filter((n: notification) => !n.is_read).length);
        }
        setLoadingNotifications(false);
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, loadingNotifications, fetchNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    return useContext(NotificationContext);
}