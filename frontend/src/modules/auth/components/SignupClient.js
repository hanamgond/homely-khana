//frontend/src/components/auth/SignupClient.js

'use client'; // Required because this page uses state and client-side logic

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import styles from "./AuthForm.module.css"; // CORRECTED PATH

export default function SignupClient() { // Renamed component
    const router = useRouter();

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

    const handleSubmit = async (e) => {
        e.preventDefault(); 

        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/users/sign-up`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    number: formData.phone,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Account created successfully! Please log in.");
                setTimeout(() => {
                    router.push("/login");
                }, 1500);
            } else {
                if (data.errors) {
                    if (data.errors.numberError) toast.error(data.errors.numberError);
                    if (data.errors.passwordError) toast.error(data.errors.passwordError);
                } else {
                    toast.error(data.error || "Signup failed. Please try again.");
                }
            }
        } catch (err) {
            toast.error("An error occurred. Could not connect to the server.");
        }
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.formCard}>
                <h2 className={styles.title}>Create Your Account</h2>
                <p className={styles.subtitle}>Get started with fresh, home-cooked meals today.</p>
                
                <form className={styles.form} onSubmit={handleSubmit}>
                    <div>
                        <label className={styles.label} htmlFor="name">Full Name</label>
                        <input type="text" name="name" id="name" className={styles.input} onChange={handleInputChange} required />
                    </div>
                    <div>
                        <label className={styles.label} htmlFor="email">Email Address</label>
                        <input type="email" name="email" id="email" className={styles.input} onChange={handleInputChange} required />
                    </div>
                    <div>
                        <label className={styles.label} htmlFor="phone">Phone Number</label>
                        <input 
                            type="tel" 
                            name="phone" 
                            id="phone" 
                            className={styles.input} 
                            onChange={handleInputChange} 
                            required 
                            maxLength="10"
                        />
                    </div>
                    <div>
                        <label className={styles.label} htmlFor="password">Create Password</label>
                        <input 
                            type="password" 
                            name="password" 
                            id="password" 
                            className={styles.input} 
                            onChange={handleInputChange} 
                            required 
                        />
                        <p className={styles.helperText}>Must be at least 8 characters and include letters & numbers.</p>
                    </div>
                    <div>
                        <label className={styles.label} htmlFor="confirmPassword">Confirm Password</label>
                        <input type="password" name="confirmPassword" id="confirmPassword" className={styles.input} onChange={handleInputChange} required />
                    </div>
                    <button className={styles.btn} type="submit">Create Account</button>
                </form>

                <div className={styles.linkCtn}>
                    <p>Already have an account? <Link href="/login">Log in</Link></p>
                </div>
            </div>
        </div>
    );
}
