const express = require('express');
const router = express.Router();
const pool = require('../db/db');
const bcrypt = require('bcrypt');
const { z } = require('zod');
const { authenticateAdmin } = require('../middlewares/auth');

// --- 1. Zod Validation Schema ---
const staffSchema = z.object({
  name: z.string().min(2, "Name is required").trim(),
  email: z.string().email("Invalid email address").toLowerCase(),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone must be exactly 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(['admin', 'kitchen_staff', 'delivery_partner', 'manager']),
  zone: z.string().nullable().optional(),
  kitchen_station: z.string().nullable().optional(),
  permissions: z.record(z.any()).optional().default({})
});

/**
 * [GET /api/team]
 * Fetch all Staff (non-customers).
 * SECURE: Admin only.
 */
router.get('/', authenticateAdmin, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, phone, role, is_active, 
              permissions, zone, kitchen_station, current_shift_status, wallet_balance, 
              last_active_at, created_at 
       FROM users 
       WHERE role != 'customer' 
       ORDER BY created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error); // Pass to Global Error Handler
  }
});

/**
 * [POST /api/team]
 * Add New Staff Member.
 * SECURE: Admin only + strict validation.
 */
router.post('/', authenticateAdmin, async (req, res, next) => {
  const validation = staffSchema.safeParse(req.body);
  
  if (!validation.success) {
    const error = new Error("Invalid staff data");
    error.statusCode = 400;
    error.details = validation.error.errors;
    return next(error);
  }

  const { 
    name, email, phone, password, role, 
    zone, kitchen_station, permissions 
  } = validation.data;

  try {
    // 1. Check duplicates
    const userCheck = await pool.query('SELECT id FROM users WHERE email = $1 OR phone = $2', [email, phone]);
    if (userCheck.rows.length > 0) {
      const error = new Error("User with this email or phone already exists.");
      error.statusCode = 409;
      return next(error);
    }

    // 2. Hash Password
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Insert into DB
    const query = `
      INSERT INTO users (
        name, email, phone, password_hash, role, 
        zone, kitchen_station, permissions, is_active, 
        current_shift_status, wallet_balance
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, 'clocked_out', 0.00)
      RETURNING id, name, role, email;
    `;
    
    const result = await pool.query(query, [
      name, email, phone, passwordHash, role, 
      zone || null, kitchen_station || null, permissions
    ]);
    
    res.status(201).json({ 
      success: true, 
      message: 'Staff added successfully', 
      user: result.rows[0] 
    });

  } catch (error) {
    next(error);
  }
});

/**
 * [PATCH /api/team/:id/status]
 * Toggle Status (Active/Inactive).
 * SECURE: Admin only.
 */
router.patch('/:id/status', authenticateAdmin, async (req, res, next) => {
  const { is_active } = req.body;
  const { id } = req.params;

  if (typeof is_active !== 'boolean') {
    const error = new Error("Invalid status provided");
    error.statusCode = 400;
    return next(error);
  }

  try {
    const result = await pool.query(
      'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id', 
      [is_active, id]
    );

    if (result.rows.length === 0) {
      const error = new Error("Staff member not found");
      error.statusCode = 404;
      return next(error);
    }

    res.json({ success: true, message: 'Staff status updated' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;