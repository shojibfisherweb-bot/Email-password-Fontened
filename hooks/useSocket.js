// app/hooks/useSocket.js
import { useEffect, useState, useRef, useCallback } from "react";
import io from "socket.io-client";

export function useSocket() {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(null);
    const [transport, setTransport] = useState(null);
    const socketRef = useRef(null);
    const reconnectAttempts = useRef(0);

    const connectSocket = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        // Use HTTPS URL to force WSS
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL ||
            'https://email-password-backend-production.up.railway.app';



        const socketInstance = io(socketUrl, {
            transports: ['websocket', 'polling'],
            path: '/socket.io/',
            withCredentials: true,
            secure: true, // Force secure connection
            rejectUnauthorized: false, // Remove in production
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 10,
            timeout: 30000,
            forceNew: false,
            autoConnect: true,
            upgrade: true,
            rememberUpgrade: true,
            // Add extra security options
            extraHeaders: {
                'Access-Control-Allow-Origin': '*'
            }
        });

        // Connection events
        socketInstance.on('connect', () => {
            setIsConnected(true);
            setSocket(socketInstance);
            setConnectionError(null);
            reconnectAttempts.current = 0;
            if (socketInstance.io.engine.transport) {
                setTransport(socketInstance.io.engine.transport.name);
            }

            // Emit admin joined event
            socketInstance.emit('admin-joined', { name: 'Admin' });
        });

        socketInstance.on('connect_error', (error) => {
            console.error('❌ Connection error:', error.message);
            setConnectionError(error.message);
            setIsConnected(false);

            // If websocket fails, try polling only
            if (error.message.includes('websocket') || error.message.includes('WebSocket')) {
                if (socketInstance.io.opts) {
                    socketInstance.io.opts.transports = ['polling'];
                }
            }
        });

        socketInstance.on('disconnect', (reason) => {
            setIsConnected(false);
            if (reason === 'io server disconnect') {
                // Server initiated disconnect, reconnect manually
                setTimeout(() => {
                    socketInstance.connect();
                }, 1000);
            }
        });

        socketInstance.on('reconnect', (attempt) => {
            setIsConnected(true);
            setConnectionError(null);
            if (socketInstance.io.engine.transport) {
                setTransport(socketInstance.io.engine.transport.name);
            }
        });

        socketInstance.on('reconnect_attempt', (attempt) => {
            reconnectAttempts.current = attempt;
            // After 3 attempts, try switching transport
            if (attempt > 3 && socketInstance.io.opts) {
                socketInstance.io.opts.transports = ['polling', 'websocket'];
            }
        });

        socketInstance.on('reconnect_error', (error) => {
            console.error('⚠️ Reconnect error:', error.message);
            setConnectionError(error.message);
        });

        socketInstance.on('reconnect_failed', () => {
            console.error('❌ Reconnect failed');
            setConnectionError('Failed to reconnect after multiple attempts');
        });

        // Transport upgrade event
        if (socketInstance.io.engine) {
            socketInstance.io.engine.on('upgrade', () => {
                if (socketInstance.io.engine.transport) {
                    const newTransport = socketInstance.io.engine.transport.name;
                    setTransport(newTransport);
                }
            });
        }

        socketInstance.on('connected', (data) => {
            if (data.transport) {
                setTransport(data.transport);
            }
        });

        socketRef.current = socketInstance;
        return socketInstance;
    }, []);

    useEffect(() => {
        const socketInstance = connectSocket();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [connectSocket]);

    const reconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            setTimeout(() => {
                if (socketRef.current) {
                    socketRef.current.connect();
                }
            }, 1000);
        } else {
            connectSocket();
        }
    }, [connectSocket]);

    const switchToPolling = useCallback(() => {
        if (socketRef.current && socketRef.current.io.opts) {
            socketRef.current.io.opts.transports = ['polling'];
            socketRef.current.disconnect();
            setTimeout(() => {
                if (socketRef.current) {
                    socketRef.current.connect();
                }
            }, 500);
        }
    }, []);

    const switchToWebSocket = useCallback(() => {
        if (socketRef.current && socketRef.current.io.opts) {
            socketRef.current.io.opts.transports = ['websocket'];
            socketRef.current.disconnect();
            setTimeout(() => {
                if (socketRef.current) {
                    socketRef.current.connect();
                }
            }, 500);
        }
    }, []);

    return {
        socket,
        isConnected,
        connectionError,
        reconnect,
        transport,
        switchToPolling,
        switchToWebSocket,
        reconnectAttempts: reconnectAttempts.current,
    };
}