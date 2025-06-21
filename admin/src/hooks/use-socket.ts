import { useEffect, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';
import type { Socket as BaseSocket } from 'socket.io-client';

// Type definition for event handlers
type EventHandler = (...args: any[]) => void;

// Define our custom auth type
type CustomAuth = {
  token?: string;
  userId?: string;
  [key: string]: any;
} | ((cb: (data: object) => void) => void);

// Create a type that combines the base Socket with our custom auth type
export type CustomSocket = BaseSocket & {
  auth?: CustomAuth;
};

// For backward compatibility
type Socket = CustomSocket;

interface UseSocketHookReturn {
  socket: Socket | null;
  isConnected: boolean;
  userRole: string | null;
  emit: (event: string, data: any) => void;
  subscribe: (event: string, callback: EventHandler) => void;
  unsubscribe: (event: string, callback: EventHandler) => void;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
}

/**
 * Custom hook to use Socket.IO throughout the application
 * @param {string[]} events - Optional array of events to subscribe to
 * @param {Record<string, EventHandler>} handlers - Optional object of event handlers
 * @returns {UseSocketHookReturn} Socket operations and state
 */
export const useSocketIO = (
  events: string[] = [],
  handlers: Record<string, EventHandler> = {}
): UseSocketHookReturn => {
  const { socket, isConnected, userRole } = useSocket();

  // Subscribe to events
  useEffect(() => {
    if (!socket) return;

    // Register all event handlers
    events.forEach((event) => {
      if (handlers[event]) {
        socket.on(event, handlers[event]);
      }
    });

    // Cleanup on unmount
    return () => {
      events.forEach((event) => {
        if (handlers[event]) {
          socket.off(event, handlers[event]);
        }
      });
    };
  }, [socket, events, handlers]);

  // Emit an event
  const emit = useCallback(
    (event: string, data: any) => {
      if (socket && isConnected) {
        socket.emit(event, data);
      } else {
        console.warn('Socket not connected, cannot emit:', event);
      }
    },
    [socket, isConnected]
  );

  // Subscribe to an event
  const subscribe = useCallback(
    (event: string, callback: EventHandler) => {
      if (socket) {
        socket.on(event, callback);
      }
    },
    [socket]
  );

  // Unsubscribe from an event
  const unsubscribe = useCallback(
    (event: string, callback: EventHandler) => {
      if (socket) {
        socket.off(event, callback);
      }
    },
    [socket]
  );

  // Join a room
  const joinRoom = useCallback(
    (room: string) => {
      if (socket && isConnected) {
        socket.emit('join_room', { room });
      }
    },
    [socket, isConnected]
  );

  // Leave a room
  const leaveRoom = useCallback(
    (room: string) => {
      if (socket && isConnected) {
        socket.emit('leave_room', { room });
      }
    },
    [socket, isConnected]
  );

  return {
    socket,
    isConnected,
    userRole,
    emit,
    subscribe,
    unsubscribe,
    joinRoom,
    leaveRoom,
  };
};

export default useSocketIO; 