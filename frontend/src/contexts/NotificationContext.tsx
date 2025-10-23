import { createContext, useContext, useEffect, useState } from "react";
import type { notification } from "../types/notification";
import { toast } from "react-toastify";
import { useUser } from "../contexts/UserContext"; // <-- import your user context

type NotificationContextType = {
    notifications: notification[];
    unreadCount: number;
    loadingNotifications: boolean;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: number) => Promise<void>;
    markAsUnread: (id: number) => Promise<void>;
    updatingIds: Set<number>; 
};

const NotificationContext = createContext<NotificationContextType>({
    notifications: [],
    unreadCount: 0,
    loadingNotifications: false,
    fetchNotifications: async () => {},
    markAsRead: async () => {},
    markAsUnread: async () => {},
    updatingIds: new Set()
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
    const { user } = useUser(); // <-- get the user

    const fetchNotifications = async () => {
        setLoadingNotifications(true);
        const response = await fetch("https://teamup-server-beryl.vercel.app/api/notif", {
            credentials: "include"
        });
        if (response.ok) {
            const data = await response.json();
            setNotifications(data);
            setUnreadCount(data.filter((n: notification) => !n.is_read).length);
        }
        setLoadingNotifications(false);
    };

    const markAsRead = async (id: number) => {
        setUpdatingIds(prev => new Set(prev).add(id));
        setNotifications(prev =>
            prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        try {
            const res = await fetch(`https://teamup-server-beryl.vercel.app/api/notif/${id}/read`, {
                method: "PATCH",
                credentials: "include"
            });
            if (!res.ok) throw new Error("Failed to update");
        } catch {
            // Revert UI if failed
            setNotifications(prev =>
                prev.map(n => n.notification_id === id ? { ...n, is_read: false } : n)
            );
            setUnreadCount(prev => prev + 1);
            toast.error("Failed to mark notification as read, please try again later", { position: "top-center" });
        } finally {
            setUpdatingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const markAsUnread = async (id: number) => {
        setUpdatingIds(prev => new Set(prev).add(id));
        setNotifications(prev =>
            prev.map(n => n.notification_id === id ? { ...n, is_read: false } : n)
        );
        setUnreadCount(prev => prev + 1);
        try {
            const res = await fetch(`https://teamup-server-beryl.vercel.app/api/notif/${id}/unread`, {
                method: "PATCH",
                credentials: "include"
            });
            if (!res.ok) throw new Error("Failed to update");
        } catch {
            // Revert UI if failed
            setNotifications(prev =>
                prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
            toast.error("Failed to mark notification as unread, please try again later", { position: "top-center" });
        } finally {
            setUpdatingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [user]); // <-- refetch when user changes

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, loadingNotifications, fetchNotifications, markAsRead, markAsUnread, updatingIds }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    return useContext(NotificationContext);
}