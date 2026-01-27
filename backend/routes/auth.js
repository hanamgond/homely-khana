if (process.env.NODE_ENV !== "production") {
  require('dotenv').config()
}

const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db/db");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/auth");
const authenticateToken = authMiddleware.authenticateToken;
const sendEmail = require("../utils/emailService");
const { z } = require("zod");

const router = express.Router();

// --- 1. Validation Schemas ---
const signupSchema = z.object({
    name: z.string().min(2).trim(),
    email: z.string().email().toLowerCase(),
    phone: z.string().regex(/^[0-9]{10}$/, "Phone must be 10 digits"),
    password: z.string().min(6, "Password must be at least 6 characters")
});

const loginSchema = z.object({
    phone: z.string().regex(/^[0-9]{10}$/),
    password: z.string().min(1)
});

// Helper to generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ==========================================
// 1. USER SIGNUP & VERIFICATION
// ==========================================

router.post("/signup", async (req, res, next) => {
    const validation = signupSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ success: false, details: validation.error.errors });
    }

    const { name, email, phone, password } = validation.data;
    
    try {
        const userExist = await pool.query(
            'SELECT * FROM "users" WHERE email = $1 OR phone = $2', 
            [email, phone]
        );

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOTP();

        if (userExist.rows.length > 0) {
            const existingUser = userExist.rows[0];

            if (existingUser.is_verified) {
                const error = new Error("User already exists. Please Login.");
                error.statusCode = 409;
                return next(error);
            }

            // Overwrite unverified user (Retry flow)
            await pool.query(
                `UPDATE "users" SET name = $1, password_hash = $2, verification_token = $3, phone = $4, email = $5 WHERE id = $6`,
                [name, hashedPassword, otp, phone, email, existingUser.id]
            );
        } else {
            await pool.query(
                `INSERT INTO "users" (name, email, phone, password_hash, role, is_verified, verification_token) VALUES ($1, $2, $3, $4, 'customer', false, $5)`,
                [name, email, phone, hashedPassword, otp]
            );
        }

        const emailHtml = `
            <div style="font-family: sans-serif; padding: 20px; text-align: center; border: 1px solid #e5e7eb; border-radius: 10px; max-width: 500px; margin: 0 auto;">
                <h2 style="color: #111827;">Verify your Email</h2>
                <h1 style="color: #F97316; letter-spacing: 5px; font-size: 32px; margin: 20px 0;">${otp}</h1>
            </div>`;

        await sendEmail(email, "Your Verification Code", emailHtml);
        res.status(200).json({ success: true, message: "OTP sent successfully!", email });

    } catch (err) {
        next(err);
    }
});

router.post("/verify-otp", async (req, res, next) => {
    const { email, otp } = req.body;
    try {
        const userResult = await pool.query('SELECT * FROM "users" WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            const error = new Error("User not found");
            error.statusCode = 404;
            return next(error);
        }

        const user = userResult.rows[0];
        if (user.verification_token !== otp) {
            const error = new Error("Invalid OTP");
            error.statusCode = 400;
            return next(error);
        }

        await pool.query('UPDATE "users" SET is_verified = TRUE, verification_token = NULL WHERE id = $1', [user.id]);
        res.json({ success: true, message: "Email verified! You can now login." });
    } catch (err) {
        next(err);
    }
});

// ==========================================
// 2. LOGIN & PROFILE
// ==========================================

router.post("/login", async (req, res, next) => {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) return res.status(400).json({ success: false, details: validation.error.errors });

    const { phone, password } = validation.data;

    try {
        const userResult = await pool.query('SELECT * FROM "users" WHERE phone = $1', [phone]);
        if (userResult.rows.length === 0) {
            const error = new Error("Invalid credentials.");
            error.statusCode = 401;
            return next(error);
        }

        const user = userResult.rows[0];
        if (!user.is_verified) {
            const error = new Error("Email not verified.");
            error.statusCode = 403;
            return next(error);
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            const error = new Error("Invalid credentials.");
            error.statusCode = 401;
            return next(error);
        }

        const token = jwt.sign(
            { userId: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({ 
            success: true, 
            token, 
            user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } 
        });
    } catch (err) {
        next(err);
    }
});

router.get("/profile", authenticateToken, async (req, res, next) => {
    try {
        console.log("🔍 [auth/profile] req.user:", req.user);
        console.log("🔍 [auth/profile] Using req.user.id:", req.user.id);
        
        const userResult = await pool.query('SELECT id, name, email, phone, role FROM "users" WHERE id = $1', [req.user.id]);
        if (userResult.rows.length === 0) return res.status(404).json({ success: false, error: "User not found." });
        res.status(200).json({ success: true, user: userResult.rows[0] });
    } catch (err) {
        next(err);
    }
});

// ==========================================
// 3. DEBUG TOKEN ROUTE (NEW - ADDED HERE)
// ==========================================

/**
 * [GET /api/auth/debug-token]
 * Debug endpoint to check JWT token structure
 * This helps identify if req.user is structured correctly
 */
router.get("/debug-token", authenticateToken, (req, res) => {
    console.log("🔍 [auth/debug-token] Current req.user:", JSON.stringify(req.user, null, 2));
    console.log("🔍 [auth/debug-token] req.user.id:", req.user.id);
    console.log("🔍 [auth/debug-token] req.user.userId:", req.user.userId);
    
    res.json({
        success: true,
        message: "Token debug info",
        user: req.user,
        availableProperties: Object.keys(req.user),
        tokenStructure: "Check server console for details"
    });
});

// ==========================================
// 4. FORGOT PASSWORD (OTP FLOW)
// ==========================================

router.post('/forgot-password', async (req, res, next) => {
  const { email } = req.body;
  try {
    const userQuery = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userQuery.rows.length === 0) {
        const error = new Error("User not found");
        error.statusCode = 404;
        return next(error);
    }

    const otp = generateOTP();
    const tokenExpiry = Date.now() + 600000; // 10 mins

    await pool.query(
      'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE email = $3',
      [otp, tokenExpiry, email]
    );

    const emailHtml = `<div style="text-align: center;"><h1>${otp}</h1></div>`;
    await sendEmail(email, "Reset Password OTP", emailHtml);

    res.json({ success: true, message: "OTP sent to your email" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;