import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const isMounted = useRef(true);

  const getUser = useCallback(() => {
    try {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    const user = getUser();
    const userId = user?.id || user?.guider_id || user?.hunter_id || user?._id;
    if (!user || !userId) return;

    try {
      const res = await axios.get(`http://localhost:3000/api/notifications/${userId}`);
      if (isMounted.current) {
        const formatted = res.data.map((n) => ({
          ...n,
          createdAt: new Date(n.created_at),
        }));
        setNotifications(formatted);
      }
    } catch (err) {
      console.error("Notifications fetch error:", err);
    }
  }, [getUser]);

  useEffect(() => {
    isMounted.current = true;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  const markRead = async (id) => {
    try {
      await axios.put(`http://localhost:3000/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: 1 } : n))
      );
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  const markAllRead = async () => {
    const user = getUser();
    const userId = user?.id || user?.guider_id || user?.hunter_id || user?._id;
    if (!user || !userId) return;
    try {
      await axios.put(`http://localhost:3000/api/notifications/read-all/${userId}`);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
    } catch (err) {
      console.error("Mark all read error:", err);
    }
  };

  // Fix: strict === 0 ki jagah !n.read use kiya taake 0, false, "0", null sab handle ho
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        markRead,
        markAllRead,
        unreadCount,
        fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);