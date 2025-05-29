"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './auth-context';
import { LocationUpdate } from '@/types';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  sendLocationUpdate: (data: Omit<LocationUpdate, 'id' | 'timestamp'>) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Only establish connection if user is logged in
    if (!user) return;

    // Create socket connection - using env variable in production
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      auth: {
        userId: user.id,
        userRole: user.role
      }
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  const sendLocationUpdate = (data: Omit<LocationUpdate, 'id' | 'timestamp'>) => {
    if (socket && connected) {
      socket.emit('location_update', data);
    }
  };

  const value = {
    socket,
    connected,
    sendLocationUpdate
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};