'use client';

import { useState, useContext } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { AppContext } from "@/utils/AppContext";
import { setCookie } from "@/utils/CookieManagement";
import styles from "./AuthForm.module.css";
// Importing icons for better UX
import { Eye, EyeOff, AlertCircle } from 'lucide-react'; 

export default function AuthForm({ defaultTab = 'login' }) {
    const router = useRouter();
    const { login } = useContext(AppContext);
    
    const [activeTab, setActiveTab] = useState(defaultTab);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Separate error state for specific feedback box
    const [formError, setFormError] = useState(""); 

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
        // Clear errors when user starts typing again to reduce friction
        if (formError) setFormError(""); 
    };

    const handleLogin = async () => {
        setIsLoading(true);
        setFormError(""); // Reset previous errors

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
                router.push("/"); // <--- Redirects to Home Page
            } else {
                // --- IMPROVISED ERROR LOGIC ---
                const msg = json.error || json.message || "";
                
                // Check specifically for "Not Found" or "Does not exist"
                if (response.status === 404 || msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("exist")) {
                    setFormError("Account does not exist. Please create an account.");
                } 
                // Check specifically for wrong password
                else if (response.status === 401 || msg.toLowerCase().includes("password") || msg.toLowerCase().includes("credentials")) {
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
                toast.success("Account created successfully! Please log in.");
                setActiveTab('login');
                setFormData(prev => ({...prev, password: '', confirmPassword: ''}));
            } else {
                // --- IMPROVISED SIGNUP LOGIC ---
                const msg = data.error || "";
                
                // Check specifically if user already exists
                if (msg.toLowerCase().includes("exists") || response.status === 409) {
                    setFormError("User already exists with this details. Please Login.");
                } else {
                    setFormError(msg || "Signup failed. Please try again.");
                }
            }
        } catch (err) {
            setFormError("An error occurred. Could not connect to the server.");
        } finally {
            setIsLoading(false);
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

                {/* --- SMART ERROR DISPLAY --- */}
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
                                tabIndex="-1" // Prevent tab from focusing on eye icon
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
                        {isLoading ? 'Processing...' : (activeTab === 'login' ? 'Login' : 'Create Account')}
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