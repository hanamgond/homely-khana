'use client';

import { useState, useContext } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { AppContext } from "@/utils/AppContext";
import { setCookie } from "@/utils/CookieManagement";
import styles from "./AuthForm.module.css";

export default function AuthForm({ defaultTab = 'login' }) {
    const router = useRouter();
    const { login } = useContext(AppContext);
    
    const [activeTab, setActiveTab] = useState(defaultTab);
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
    };

    const handleLogin = async () => {
        try {
            // --- FIX: Added /api prefix ---
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
                toast.success("Login successful! Redirecting...");
                router.push("/dashboard");
            } else {
                toast.error(json.error || "Login failed. Please check your credentials.");
            }
        } catch (error) {
            toast.error("An error occurred while trying to log in.");
        }
    };

    const handleSignup = async () => {
        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }
        try {
            // --- FIX: Added /api prefix ---
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
                toast.success("Account created successfully! Please log in.");
                setActiveTab('login'); 
            } else {
                toast.error(data.error || "Signup failed. Please try again.");
            }
        } catch (err) {
            toast.error("An error occurred. Could not connect to the server.");
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (activeTab === 'login') {
            handleLogin();
        } else {
            handleSignup();
        }
    };

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
                        onClick={() => setActiveTab('login')}
                    >
                        Login
                    </button>
                    <button 
                        className={`${styles.tabButton} ${activeTab === 'signup' ? styles.active : ''}`}
                        onClick={() => setActiveTab('signup')}
                    >
                        Sign Up
                    </button>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    {activeTab === 'signup' && (
                        <>
                            <div className={styles.inputGroup}>
                                <label htmlFor="name">Full Name</label>
                                <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} required />
                            </div>
                            <div className={styles.inputGroup}>
                                <label htmlFor="email">Email Address</label>
                                <input type="email" name="email" id="email" value={formData.email} onChange={handleInputChange} required />
                            </div>
                        </>
                    )}
                    
                    <div className={styles.inputGroup}>
                        <label htmlFor="phone">Mobile Number</label>
                        <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleInputChange} required maxLength="10" />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Password</label>
                        <input type="password" name="password" id="password" value={formData.password} onChange={handleInputChange} required />
                    </div>

                    {activeTab === 'signup' && (
                        <div className={styles.inputGroup}>
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input type="password" name="confirmPassword" id="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required />
                        </div>
                    )}
                    
                    <button className={styles.submitButton} type="submit">
                        {activeTab === 'login' ? 'Login' : 'Create Account'}
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