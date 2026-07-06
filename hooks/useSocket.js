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
    const reconnectTimerRef = useRef(null);
    const isConnectingRef = useRef(false);

    const connectSocket = useCallback(() => {
        // একই সময়ে একাধিক সংযোগ প্রতিরোধ
        if (isConnectingRef.current) {
            console.log("⏳ Connection already in progress...");
            return socketRef.current;
        }

        if (socketRef.current) {
            // যদি সংযোগ ইতিমধ্যে থাকে কিন্তু সংযোগ বিচ্ছিন্ন হয়
            if (socketRef.current.connected) {
                console.log("✅ Socket already connected");
                return socketRef.current;
            }

            // পুরনো সংযোগ পরিষ্কার করুন
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        isConnectingRef.current = true;

        // Socket.IO সার্ভারের URL
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL ||
            'https://email-password-backend-production.up.railway.app';

        console.log(`🔌 Connecting to: ${socketUrl}`);

        const socketInstance = io(socketUrl, {
            // **শুধুমাত্র polling দিয়ে শুরু করুন**
            transports: ['polling'],
            path: '/socket.io/',
            withCredentials: true,
            secure: false, // Vercel-এর জন্য false রাখুন
            rejectUnauthorized: false,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 8000,
            reconnectionAttempts: 15,
            timeout: 60000,
            forceNew: true,
            autoConnect: true,
            upgrade: false, // **ম্যানুয়ালি আপগ্রেড করবেন**
            // Vercel-এর জন্য স্পেসিফিক হেডার
            extraHeaders: {
                'Access-Control-Allow-Origin': '*',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        // **সংযোগ ইভেন্ট**
        socketInstance.on('connect', () => {
            console.log('✅ Socket connected successfully');
            isConnectingRef.current = false;
            setIsConnected(true);
            setSocket(socketInstance);
            setConnectionError(null);
            reconnectAttempts.current = 0;

            // Transport দেখান
            if (socketInstance.io.engine.transport) {
                const currentTransport = socketInstance.io.engine.transport.name;
                setTransport(currentTransport);
                console.log(`🔌 Current transport: ${currentTransport}`);
            }

            // **WebSocket-এ আপগ্রেড করার চেষ্টা**
            if (socketInstance.io.engine.transport.name === 'polling') {
                setTimeout(() => {
                    if (socketInstance && socketInstance.io.engine) {
                        console.log('⬆️ Attempting to upgrade to websocket...');
                        socketInstance.io.engine.upgrade();
                    }
                }, 2000);
            }

            // Admin যোগদান
            socketInstance.emit('admin-joined', { name: 'Admin' });
        });

        // **Transport আপগ্রেড ইভেন্ট**
        socketInstance.io.engine.on('upgrade', () => {
            const newTransport = socketInstance.io.engine.transport.name;
            console.log(`🔄 Transport upgraded to: ${newTransport}`);
            setTransport(newTransport);
        });

        // **Transport ডাউনগ্রেড ইভেন্ট**
        socketInstance.io.engine.on('upgradeError', (err) => {
            console.warn('⚠️ Upgrade error:', err.message);
            // আপগ্রেড ব্যর্থ হলে polling-এ থাকুন
            if (socketInstance.io.engine.transport) {
                const currentTransport = socketInstance.io.engine.transport.name;
                console.log(`📡 Falling back to: ${currentTransport}`);
                setTransport(currentTransport);
            }
        });

        socketInstance.on('connect_error', (error) => {
            console.error('❌ Connection error:', error.message);
            isConnectingRef.current = false;
            setConnectionError(error.message);
            setIsConnected(false);

            // যদি websocket সমস্যা হয়, polling-এ থাকুন
            if (error.message.includes('websocket') || error.message.includes('WebSocket')) {
                console.log('🔄 Forcing polling transport...');
                if (socketInstance.io.opts) {
                    socketInstance.io.opts.transports = ['polling'];
                    socketInstance.io.opts.upgrade = false;
                }
            }
        });

        socketInstance.on('disconnect', (reason) => {
            console.log(`⚠️ Socket disconnected: ${reason}`);
            setIsConnected(false);

            if (reason === 'io server disconnect') {
                // সার্ভার সংযোগ বিচ্ছিন্ন করেছে, পুনরায় সংযোগ
                console.log('🔄 Reconnecting due to server disconnect...');
                setTimeout(() => {
                    if (socketInstance) {
                        socketInstance.connect();
                    }
                }, 2000);
            }
        });

        socketInstance.on('reconnect', (attemptNumber) => {
            console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
            setIsConnected(true);
            setConnectionError(null);

            if (socketInstance.io.engine.transport) {
                setTransport(socketInstance.io.engine.transport.name);
            }
        });

        socketInstance.on('reconnect_attempt', (attemptNumber) => {
            reconnectAttempts.current = attemptNumber;
            console.log(`🔄 Reconnect attempt #${attemptNumber}`);

            // ৫ বার চেষ্টার পর transport পরিবর্তন
            if (attemptNumber > 5 && socketInstance.io.opts) {
                console.log('🔄 Switching transport strategy...');
                socketInstance.io.opts.transports = ['polling', 'websocket'];
            }
        });

        socketInstance.on('reconnect_error', (error) => {
            console.error('⚠️ Reconnect error:', error.message);
            setConnectionError(error.message);
        });

        socketInstance.on('reconnect_failed', () => {
            console.error('❌ Reconnect failed after all attempts');
            setConnectionError('Failed to reconnect after multiple attempts');
            isConnectingRef.current = false;
        });

        socketInstance.on('error', (error) => {
            console.error('Socket error:', error);
        });

        // **সংযোগ বজায় রাখার জন্য Ping**
        socketInstance.on('ping', () => {
            console.log('📡 Ping received');
        });

        socketInstance.on('pong', (latency) => {
            console.log(`📡 Pong received, latency: ${latency}ms`);
        });

        socketRef.current = socketInstance;
        return socketInstance;
    }, []);

    // **হিটপিং/রিকানেক্ট ফাংশন**
    const reconnect = useCallback(() => {
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }

        if (socketRef.current) {
            socketRef.current.disconnect();
            setTimeout(() => {
                if (socketRef.current) {
                    socketRef.current.connect();
                } else {
                    connectSocket();
                }
            }, 1000);
        } else {
            connectSocket();
        }
    }, [connectSocket]);

    // **Transport সুইচ**
    const switchToPolling = useCallback(() => {
        if (socketRef.current && socketRef.current.io.opts) {
            socketRef.current.io.opts.transports = ['polling'];
            socketRef.current.io.opts.upgrade = false;
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
            socketRef.current.io.opts.upgrade = false;
            socketRef.current.disconnect();
            setTimeout(() => {
                if (socketRef.current) {
                    socketRef.current.connect();
                }
            }, 500);
        }
    }, []);

    // **Auto-reconnect interval**
    useEffect(() => {
        const interval = setInterval(() => {
            if (socketRef.current && !socketRef.current.connected && !isConnectingRef.current) {
                console.log('🔄 Auto-reconnect triggered');
                reconnect();
            }
        }, 30000); // প্রতি ৩০ সেকেন্ডে চেক করুন

        return () => {
            clearInterval(interval);
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
            }
        };
    }, [reconnect]);

    // **সংযোগ স্থাপন**
    useEffect(() => {
        const socketInstance = connectSocket();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
            }
            isConnectingRef.current = false;
        };
    }, [connectSocket]);

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