// backend/routes/team.js
const express = require('express');
const router = express.Router();
const pool = require('../db/db');
const bcrypt = require('bcrypt');

// GET: Fetch all Staff (non-customers)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, phone, role, is_active, 
              permissions, zone, kitchen_station, current_shift_status, wallet_balance, 
              last_active_at, created_at 
       FROM users 
       WHERE role != 'customer' 
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST: Add New Staff Member
router.post('/', async (req, res) => {
  try {
    const { 
      name, email, phone, password, role, 
      zone, kitchen_station, permissions 
    } = req.body;

    // 1. Validation
    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // 2. Check duplicates
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1 OR phone = $2', [email, phone]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'User with this email or phone already exists.' });
    }

    // 3. Hash Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Insert into DB (Updated for new Schema)
    // Note: We use COALESCE/Defaults for optional fields
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
      name, 
      email, 
      phone, 
      passwordHash, 
      role, 
      zone || null,            // Send null if empty
      kitchen_station || null, // Send null if empty
      permissions || {}        // Send empty json if missing
    ]);
    
    res.status(201).json({ message: 'Staff added successfully', user: result.rows[0] });

  } catch (error) {
    console.error('Error adding staff:', error);
    res.status(500).json({ message: 'Server error adding staff' });
  }
});

// PATCH: Toggle Status (Active/Inactive)
router.patch('/:id/status', async (req, res) => {
  try {
    const { is_active } = req.body;
    const { id } = req.params;

    await pool.query('UPDATE users SET is_active = $1 WHERE id = $2', [is_active, id]);
    res.json({ message: 'Staff status updated' });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;