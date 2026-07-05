// app/hooks/useSocket.js
import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

export function useSocket() {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef(null);

    useEffect(() => {
        // Clean up existing socket
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:3001", {
            transports: ["websocket"],
            withCredentials: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: Infinity,
        });

        socketInstance.on("connect", () => {
            console.log("✅ Socket connected");
            setIsConnected(true);
            setSocket(socketInstance);
        });

        socketInstance.on("reconnect", () => {
            console.log("✅ Socket reconnected");
            setIsConnected(true);
        });

        socketInstance.on("disconnect", () => {
            console.log("❌ Socket disconnected");
            setIsConnected(false);
        });

        socketInstance.on("connect_error", (error) => {
            console.error("⚠️ Socket connection error:", error);
            setIsConnected(false);
        });

        socketRef.current = socketInstance;

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    return { socket, isConnected };
}