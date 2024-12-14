import React, { createContext, useContext, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { fetchAuthSession } from 'aws-amplify/auth';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  error: Error | null;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
  error: null,
});

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initSocket = async () => {
      try {
        const { tokens } = await fetchAuthSession();
        const token = tokens?.idToken?.toString();
        
        const newSocket = io(process.env.REACT_APP_API_ENDPOINT || '', {
          auth: { token },
        });

        newSocket.on('connect', () => {
          setIsConnected(true);
          setError(null);
        });

        newSocket.on('connect_error', (error) => {
          setIsConnected(false);
          setError(error);
        });

        newSocket.on('disconnect', () => {
          setIsConnected(false);
        });

        setSocket(newSocket);

        return () => {
          newSocket.disconnect();
        };
      } catch (error) {
        setError(error as Error);
      }
    };

    initSocket();
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket, isConnected, error }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);