import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Connect to backend Socket.IO server
    const socketInstance = io('http://localhost:5000');
    setSocket(socketInstance);

    // Fetch initial list of system notifications from DB
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/notifications', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const json = await res.json();
        if (json.success) {
          setNotifications(json.data);
        }
      } catch (err) {
        console.error('Failed to load notifications from DB:', err);
      }
    };
    fetchNotifications();

    // Listen for live broadcast notifications
    socketInstance.on('newNotification', (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev].slice(0, 30)); // Cap at 30 items
      
      // Browser notification/audio simulation (optional)
      if (Notification.permission === 'granted') {
        new Notification(newNotif.title, { body: newNotif.message });
      }
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated]);

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/notifications/read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      // Mark local state as read
      setNotifications([]);
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, notifications, markAllAsRead }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
