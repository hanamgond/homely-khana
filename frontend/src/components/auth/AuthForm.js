//frontend/src/componets/auth/AuthForm.js

'use client';

import { useState, useContext } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { AppContext } from "@/utils/AppContext";
import { setCookie } from "@/utils/CookieManagement";
import styles from "./AuthForm.module.css";
// Added KeyRound for OTP screen
import { Eye, EyeOff, AlertCircle, KeyRound } from 'lucide-react';

export default function AuthForm({ defaultTab = 'login' }) {
    const router = useRouter();
    const { login } = useContext(AppContext);
    
    // States: 'login' | 'signup' | 'otp'
    const [activeTab, setActiveTab] = useState(defaultTab);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState(""); 
    
    // OTP State
    const [otp, setOtp] = useState("");

    const [formData, setFormData] = useState({ 
        name: '', 
        email: '', 
        phone: '', 
        password: '', 
        confirmPassword: '' 
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formError) setFormError(""); 
    };

    // --- 1. SIGNUP: Sends OTP ---
    const handleSignup = async () => {
        if (formData.password !== formData.confirmPassword) {
            setFormError("Passwords do not match.");
            return;
        }
        
        setIsLoading(true);
        setFormError("");

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password
                })
            });
            const data = await response.json();

            if (data.success) {
                toast.success("OTP sent to your email!");
                setActiveTab('otp'); // Switch to OTP screen
            } else {
                setFormError(data.error || "Signup failed.");
            }
        } catch (err) {
            setFormError("Connection failed. Check backend.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- 2. VERIFY OTP ---
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setFormError("");

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/auth/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: formData.email, otp })
            });
            const data = await response.json();

            if (data.success) {
                toast.success("Verified! Please login.");
                setActiveTab('login');
                // Clear sensitive fields
                setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
            } else {
                setFormError(data.message || "Invalid OTP");
            }
        } catch (err) {
            setFormError("Verification failed.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- 3. LOGIN (Existing) ---
    const handleLogin = async () => {
        setIsLoading(true);
        setFormError(""); 

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    phone: formData.phone, 
                    password: formData.password 
                }),
            });
            const json = await response.json();

            if (json.success) {
                setCookie(json.token);
                login(json.user); 
                toast.success("Login successful!");
                router.push("/"); 
            } else {
                const msg = json.error || json.message || "";
                
                if (response.status === 403 || msg.toLowerCase().includes("verified")) {
                    setFormError("Email not verified. Please verify your account.");
                    // Optional: You could redirect them to OTP screen here if you had logic to resend OTP
                }
                else if (response.status === 404 || msg.toLowerCase().includes("not found")) {
                    setFormError("Account does not exist. Please create an account.");
                } 
                else if (response.status === 401) {
                    setFormError("Incorrect password. Please try again.");
                } 
                else {
                    setFormError(msg || "Login failed. Please check your inputs.");
                }
            }
        } catch (error) {
            setFormError("Unable to connect to server. Please check your internet.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (activeTab === 'login') handleLogin();
        else if (activeTab === 'signup') handleSignup();
        else if (activeTab === 'otp') handleVerifyOtp(e);
    };

    // --- RENDER OTP SCREEN ---
    if (activeTab === 'otp') {
        return (
            <div className={styles.pageContainer}>
                <div className={styles.formCard}>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <div style={{ background: '#fff7ed', width: '60px', height: '60px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#f97316', margin: '0 auto' }}>
                            <KeyRound size={28} />
                        </div>
                        <h2 className={styles.title} style={{ marginTop: '15px' }}>Enter OTP</h2>
                        <p className={styles.subtitle}>We sent a 6-digit code to <br/><strong>{formData.email}</strong></p>
                    </div>

                    {formError && (
                        <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
                            {formError}
                        </div>
                    )}

                    <form onSubmit={handleVerifyOtp} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <input 
                                type="text" 
                                value={otp} 
                                onChange={(e) => setOtp(e.target.value)} 
                                placeholder="123456"
                                style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}
                                maxLength={6}
                                required
                            />
                        </div>
                        <button type="submit" className={styles.submitButton} disabled={isLoading}>
                            {isLoading ? 'Verifying...' : 'Verify & Create Account'}
                        </button>
                    </form>
                    
                    <button 
                        onClick={() => setActiveTab('signup')} 
                        style={{ marginTop: '20px', color: '#666', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textDecoration: 'underline' }}
                    >
                        Wrong email? Go back
                    </button>
                </div>
            </div>
        );
    }

    // --- RENDER LOGIN / SIGNUP (Standard) ---
    return (
        <div className={styles.pageContainer}>
            <Link href="/" className={styles.backToHome}>
                ← Back to Home
            </Link>

            <div className={styles.formCard}>
                <h1 className={styles.title}>HomelyKhana</h1>
                <p className={styles.subtitle}>
                    {activeTab === 'login' ? 'Welcome back! Please login to continue' : 'Create an account to get started'}
                </p>

                <div className={styles.tabGroup}>
                    <button 
                        className={`${styles.tabButton} ${activeTab === 'login' ? styles.active : ''}`}
                        onClick={() => { setActiveTab('login'); setFormError(""); }}
                    >
                        Login
                    </button>
                    <button 
                        className={`${styles.tabButton} ${activeTab === 'signup' ? styles.active : ''}`}
                        onClick={() => { setActiveTab('signup'); setFormError(""); }}
                    >
                        Sign Up
                    </button>
                </div>

                {formError && (
                    <div style={{
                        background: '#fee2e2', 
                        color: '#b91c1c', 
                        padding: '12px', 
                        borderRadius: '8px', 
                        marginBottom: '1rem', 
                        fontSize: '0.9rem',
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        border: '1px solid #fca5a5'
                    }}>
                        <AlertCircle size={18} flexShrink={0} />
                        <span>{formError}</span>
                    </div>
                )}

                <form className={styles.form} onSubmit={handleSubmit}>
                    {activeTab === 'signup' && (
                        <>
                            <div className={styles.inputGroup}>
                                <label htmlFor="name">Full Name</label>
                                <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} required placeholder="John Doe" />
                            </div>
                            <div className={styles.inputGroup}>
                                <label htmlFor="email">Email Address</label>
                                <input type="email" name="email" id="email" value={formData.email} onChange={handleInputChange} required placeholder="john@example.com" />
                            </div>
                        </>
                    )}
                    
                    <div className={styles.inputGroup}>
                        <label htmlFor="phone">Mobile Number</label>
                        <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleInputChange} required maxLength="10" placeholder="9876543210" />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Password</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input 
                                type={showPassword ? "text" : "password"} 
                                name="password" 
                                id="password" 
                                value={formData.password} 
                                onChange={handleInputChange} 
                                required 
                                style={{ width: '100%', paddingRight: '40px' }} 
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', right: '10px', background: 'none', 
                                    border: 'none', cursor: 'pointer', color: '#666', display: 'flex'
                                }}
                                tabIndex="-1" 
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {activeTab === 'signup' && (
                        <div className={styles.inputGroup}>
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input type="password" name="confirmPassword" id="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required />
                        </div>
                    )}
                    
                    <button 
                        className={styles.submitButton} 
                        type="submit" 
                        disabled={isLoading}
                        style={{ opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
                    >
                        {isLoading ? 'Processing...' : (activeTab === 'login' ? 'Login' : 'Send OTP')}
                    </button>

                    {activeTab === 'login' && (
                        <Link href="/forgot-password" className={styles.secondaryLink}>
                            Forgot Password?
                        </Link>
                    )}
                </form>
            </div>
        </div>
    );
}