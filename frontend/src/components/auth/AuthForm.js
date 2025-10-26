'use client';

import { useState } from "react"; // Removed useContext
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import styles from "./AuthForm.module.css";

// --- NEW IMPORTS ---
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { loginUser, signupUser } from '@/lib/api'; // Our API functions

// --- REMOVED IMPORTS ---
// import { AppContext } from "@/utils/AppContext";
// import { setCookie } from "@/utils/CookieManagement";

export default function AuthForm({ defaultTab = 'login' }) {
    const router = useRouter();
    const queryClient = useQueryClient();

    // --- NEW: Get the setToken function from our Zustand store ---
    const setToken = useAuthStore((state) => state.setToken);

    // --- REMOVED APP CONTEXT ---
    // const { login } = useContext(AppContext);
    
    // --- LOCAL UI STATE (Unchanged) ---
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

    // --- NEW: Login Mutation ---
    const { mutate: performLogin, isPending: isLoginPending } = useMutation({
        mutationFn: loginUser, // Uses our api.js function
        onSuccess: (data) => {
            // data is { token, user } from our api.js handler
            setToken(data.token); // 1. Save token to Zustand store
            
            // 2. Invalidate profile query to force Header/Profile pages to refetch
            queryClient.invalidateQueries({ queryKey: ['profile'] }); 
            
            toast.success("Login successful! Redirecting...");
            router.push("/dashboard"); // 3. Redirect
        },
        onError: (err) => {
            toast.error(err.message || "Login failed. Please check your credentials.");
        }
    });

    // --- NEW: Signup Mutation ---
    const { mutate: performSignup, isPending: isSignupPending } = useMutation({
        mutationFn: signupUser, // Uses our api.js function
        onSuccess: () => {
            // Replicates your original flow: signup > toast > switch to login tab
            toast.success("Account created successfully! Please log in.");
            setActiveTab('login'); 
        },
        onError: (err) => {
            toast.error(err.message || "Signup failed. Please try again.");
        }
    });

    // --- REMOVED: Old handleLogin and handleSignup functions ---

    // --- UPDATED: handleSubmit to use mutations ---
    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (activeTab === 'login') {
            performLogin({ 
                phone: formData.phone, 
                password: formData.password 
            });
        } else {
            if (formData.password !== formData.confirmPassword) {
                toast.error("Passwords do not match.");
                return;
            }
            performSignup({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password
            });
        }
    };
    
    // Check if either mutation is running
    const isPending = isLoginPending || isSignupPending;

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
                    
                    {/* --- UPDATED: Submit button with loading state --- */}
                    <button className={styles.submitButton} type="submit" disabled={isPending}>
                        {isLoginPending ? 'Logging in...' : 
                         isSignupPending ? 'Creating Account...' : 
                         (activeTab === 'login' ? 'Login' : 'Create Account')}
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