if (process.env.NODE_ENV !== "production") {
  require('dotenv').config()
}

const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db/db");
const jwt = require("jsonwebtoken");
// --- FIX: De-structure the import ---
const { authenticateToken } = require("../middlewares/auth");

const router = express.Router();

// Route for User Signup
router.post("/signup", async (req, res) => {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
        return res.status(400).json({ success: false, error: "All fields are required." });
    }
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        // --- FIX: Also return the user's role on signup ---
        const newUser = await pool.query(
            'INSERT INTO "users" (name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, email, phone, role',
            [name, email, phone, hashedPassword]
        );
        res.status(201).json({ success: true, message: "Account created successfully!", user: newUser.rows[0] });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ success: false, error: "A user with this email or phone number already exists." });
        }
        console.error("SIGNUP ERROR:", err.message);
        res.status(500).json({ success: false, error: "An internal server error occurred." });
    }
});

// Route for User Login
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
              role: user.role // --- FIX 1: Add user's role to the JWT payload ---
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // --- FIX 2: Add user's role to the JSON response ---
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

// Route to get the logged-in user's profile
router.get("/profile", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        // --- FIX: Also return the user's role from their profile ---
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

module.exports = router;