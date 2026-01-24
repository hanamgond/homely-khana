if (process.env.NODE_ENV !== "production") {
  require('dotenv').config()
}

const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db/db");
const jwt = require("jsonwebtoken");
const { authenticateToken } = require("../middlewares/auth");
const sendEmail = require("../utils/emailService");

const router = express.Router();

// Helper to generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ==========================================
// 1. USER SIGNUP & VERIFICATION
// ==========================================

// Route for User Signup
router.post("/signup", async (req, res) => {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
        return res.status(400).json({ success: false, error: "All fields are required." });
    }
    
    try {
        // Check if user exists (by email or phone)
        const userExist = await pool.query(
            'SELECT * FROM "users" WHERE email = $1 OR phone = $2', 
            [email, phone]
        );

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOTP();

        if (userExist.rows.length > 0) {
            const existingUser = userExist.rows[0];

            // SCENARIO A: User exists and is ALREADY verified -> Block them.
            if (existingUser.is_verified) {
                return res.status(409).json({ success: false, error: "User already exists. Please Login." });
            }

            // SCENARIO B: User exists but is NOT verified -> Overwrite (Retry).
            await pool.query(
                `UPDATE "users" 
                 SET name = $1, password_hash = $2, verification_token = $3, phone = $4, email = $5
                 WHERE id = $6`,
                [name, hashedPassword, otp, phone, email, existingUser.id]
            );

        } else {
            // SCENARIO C: New User -> Create them
            await pool.query(
                `INSERT INTO "users" (
                    name, email, phone, password_hash, 
                    role, is_verified, verification_token
                 ) VALUES ($1, $2, $3, $4, 'customer', false, $5)`,
                [name, email, phone, hashedPassword, otp]
            );
        }

        // Send OTP Email
        const emailHtml = `
            <div style="font-family: sans-serif; padding: 20px; text-align: center; border: 1px solid #e5e7eb; border-radius: 10px; max-width: 500px; margin: 0 auto;">
                <h2 style="color: #111827;">Verify your Email</h2>
                <p style="color: #6b7280;">Your verification code for HomelyKhana is:</p>
                <h1 style="color: #F97316; letter-spacing: 5px; font-size: 32px; margin: 20px 0;">${otp}</h1>
                <p style="font-size: 12px; color: #9ca3af;">This code is valid for 10 minutes.</p>
            </div>
        `;

        await sendEmail(email, "Your Verification Code", emailHtml);

        res.status(200).json({ 
            success: true, 
            message: "OTP sent successfully!",
            email: email 
        });

    } catch (err) {
        console.error("SIGNUP ERROR:", err);
        res.status(500).json({ success: false, error: "An internal server error occurred." });
    }
});

// Verify Signup OTP
router.post("/verify-otp", async (req, res) => {
    const { email, otp } = req.body;

    try {
        const userResult = await pool.query('SELECT * FROM "users" WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        const user = userResult.rows[0];

        if (user.verification_token !== otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP. Please try again." });
        }

        // Verify Success: Clear token and mark verified
        await pool.query(
            'UPDATE "users" SET is_verified = TRUE, verification_token = NULL WHERE id = $1',
            [user.id]
        );

        res.json({ success: true, message: "Email verified! You can now login." });

    } catch (err) {
        console.error("OTP VERIFY ERROR:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ==========================================
// 2. LOGIN & PROFILE
// ==========================================

// User Login
router.post("/login", async (req, res) => {
    const { phone, password } = req.body;

    if (!phone || !password) {
        return res.status(400).json({ success: false, error: "Phone number and password are required." });
    }

    try {
        const userResult = await pool.query('SELECT * FROM "users" WHERE phone = $1', [phone]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({ success: false, error: "Invalid credentials." });
        }

        const user = userResult.rows[0];

        // Check Verification Status
        if (!user.is_verified) {
            return res.status(403).json({ 
                success: false, 
                error: "Email not verified. Please verify your account." 
            });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ success: false, error: "Invalid credentials." });
        }

        const token = jwt.sign(
            { 
              userId: user.id, 
              name: user.name, 
              email: user.email, 
              phone: user.phone,
              role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        const userResponse = { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          phone: user.phone, 
          role: user.role 
        };
        
        res.status(200).json({ success: true, token, user: userResponse });
    } catch (err) {
        console.error("LOGIN ERROR:", err.message);
        res.status(500).json({ success: false, error: "An internal server error occurred." });
    }
});

// Get Profile
router.get("/profile", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const userResult = await pool.query('SELECT id, name, email, phone, role FROM "users" WHERE id = $1', [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: "User not found." });
        }
        res.status(200).json({ success: true, user: userResult.rows[0] });
    } catch (err) {
        console.error("PROFILE FETCH ERROR:", err.message);
        res.status(500).json({ success: false, error: "An internal server error occurred." });
    }
});

// ==========================================
// 3. FORGOT PASSWORD (OTP FLOW)
// ==========================================

// Forgot Password: Sends OTP
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  try {
    const userQuery = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Generate 6-digit OTP
    const otp = generateOTP();
    const tokenExpiry = Date.now() + 600000; // 10 minutes

    // Save OTP to DB (using reset_password_token)
    await pool.query(
      'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE email = $3',
      [otp, tokenExpiry, email]
    );

    // Send Email
    const emailHtml = `
      <div style="font-family: sans-serif; padding: 20px; text-align: center; border: 1px solid #e5e7eb; border-radius: 10px; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #111827;">Reset Your Password</h2>
          <p style="color: #6b7280;">Your password reset code is:</p>
          <h1 style="color: #F97316; letter-spacing: 5px; font-size: 32px; margin: 20px 0;">${otp}</h1>
          <p style="font-size: 12px; color: #9ca3af;">This code is valid for 10 minutes.</p>
      </div>
    `;
    
    await sendEmail(email, "Reset Password OTP", emailHtml);

    res.json({ success: true, message: "OTP sent to your email" });

  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Reset Password: Verifies OTP & Updates Password
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    // Find user with matching Email AND valid OTP
    const userQuery = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND reset_password_token = $2', 
      [email, otp]
    );

    if (userQuery.rows.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid OTP or Email" });
    }

    const user = userQuery.rows[0];

    // Check Expiry
    if (parseInt(user.reset_password_expires) < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP has expired" });
    }

    // Hash New Password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update Password & Clear Token
    await pool.query(
      'UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );

    res.json({ success: true, message: "Password updated successfully" });

  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;