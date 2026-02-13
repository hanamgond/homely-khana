//src/modules/auth/components/ForgotPasswordClient.js
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Lock, KeyRound, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from "sonner";
import styles from './ForgotPassword.module.css';

export default function ForgotPassword() {
  const router = useRouter();
  
  // State: 'email' | 'reset' | 'success'
  const [step, setStep] = useState('email'); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Form Data
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Visibility Toggles
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // STEP 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("OTP sent to your email!");
        setStep('reset');
      } else {
        setError(data.message || "Failed to send OTP");
      }
    } catch (err) {
      setError("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP & Update Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();

      if (data.success) {
        setStep('success');
        toast.success("Password reset successfully!");
        setTimeout(() => router.push('/login'), 3000);
      } else {
        setError(data.message || "Reset failed. Invalid OTP?");
      }
    } catch (err) {
      setError("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      
      {/* Back Link positioned absolutely or outside card like AuthForm */}
      <Link href="/login" className={styles.backToHome}>
        ← Back to Login
      </Link>

      <div className={styles.formCard}>
        
        {/* Step 1: Request OTP Form */}
        {step === 'email' && (
          <>
            <h1 className={styles.title}>Forgot Password?</h1>
            <p className={styles.subtitle}>Enter your email address and we&apos;ll send you a code.</p>
            
            {error && (
               <div className={styles.errorBox}>
                   <AlertCircle size={18} /> {error}
               </div>
            )}

            <form onSubmit={handleRequestOtp} className={styles.form}>
              <div className={styles.inputGroup}>
                <label>Email Address</label>
                <div className={styles.inputWrapper}>
                  <Mail className={styles.inputIcon} size={20} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    className={styles.input}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className={styles.submitButton}>
                {loading ? 'Sending Code...' : 'Send OTP Code'}
              </button>
            </form>
          </>
        )}

        {/* Step 2: Reset Form */}
        {step === 'reset' && (
          <>
            <button onClick={() => setStep('email')} className={styles.changeEmailLink}>
              ← Change Email
            </button>
            <h1 className={styles.title}>Reset Password</h1>
            <p className={styles.subtitle}>
              We sent a 6-digit code to <strong>{email}</strong>
            </p>

            {error && (
               <div className={styles.errorBox}>
                   <AlertCircle size={18} /> {error}
               </div>
            )}

            <form onSubmit={handleResetPassword} className={styles.form}>
              
              {/* OTP Field */}
              <div className={styles.inputGroup}>
                <label>OTP Code</label>
                <div className={styles.inputWrapper}>
                  <KeyRound className={styles.inputIcon} size={20} />
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value); setError(""); }}
                    className={`${styles.input} ${styles.otpInput}`}
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>
              </div>

              {/* New Password */}
              <div className={styles.inputGroup}>
                <label>New Password</label>
                <div className={styles.inputWrapper}>
                  <Lock className={styles.inputIcon} size={20} />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                    className={styles.input}
                    placeholder="••••••••"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className={styles.passwordToggle}
                    tabIndex="-1"
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className={styles.inputGroup}>
                <label>Confirm Password</label>
                <div className={styles.inputWrapper}>
                  <Lock className={styles.inputIcon} size={20} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                    className={styles.input}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={styles.passwordToggle}
                    tabIndex="-1"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className={styles.submitButton}>
                {loading ? 'Updating...' : 'Set New Password'}
              </button>
            </form>
          </>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <div className={styles.successContainer}>
            <div className={styles.successIcon}>
              <CheckCircle size={36} />
            </div>
            <h2 className={styles.title}>Password Reset!</h2>
            <p className={styles.subtitle}>Your password has been updated successfully.</p>
            <p className={styles.redirectText}>Redirecting to login...</p>
          </div>
        )}

      </div>
    </div>
  );
}