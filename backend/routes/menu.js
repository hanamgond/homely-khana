// backend/routes/menu.js
const express = require('express');
const router = express.Router();
const pool = require('../db/db');

// Optional: Import Auth Middleware if you have it implemented
// const { authenticateToken, authorizeAdmin } = require('../middleware/auth'); 

// ----------------------------------------------------------------------
// GET: Fetch Weekly Menu (Sorted by Day & Meal Type)
// ----------------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    // We use a CASE statement to force the correct chronological order
    // Monday=1, Tuesday=2, ... and Lunch=1, Dinner=2
    const query = `
      SELECT * FROM weekly_menu_items 
      WHERE is_active = true 
      ORDER BY 
        CASE day_of_week
          WHEN 'Monday' THEN 1
          WHEN 'Tuesday' THEN 2
          WHEN 'Wednesday' THEN 3
          WHEN 'Thursday' THEN 4
          WHEN 'Friday' THEN 5
          WHEN 'Saturday' THEN 6
          WHEN 'Sunday' THEN 7
        END ASC,
        CASE meal_type
          WHEN 'Lunch' THEN 1
          WHEN 'Dinner' THEN 2
          ELSE 3
        END ASC
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ message: 'Server error fetching menu' });
  }
});

// ----------------------------------------------------------------------
// POST: Create New Menu Item
// ----------------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { day_of_week, meal_type, title, description, calories, tags, image_url } = req.body;
    
    // Basic Validation
    if (!day_of_week || !meal_type || !title) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = await pool.query(
      `INSERT INTO weekly_menu_items 
       (day_of_week, meal_type, title, description, calories, tags, image_url, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING *`,
      [
        day_of_week, 
        meal_type, 
        title, 
        description, 
        calories, 
        JSON.stringify(tags || []), // Ensure tags is always a valid JSON/Array string
        image_url
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding menu item:', error);
    res.status(500).json({ message: 'Server error adding item' });
  }
});

// ----------------------------------------------------------------------
// PUT: Update Existing Menu Item (Critical for Admin Panel)
// ----------------------------------------------------------------------
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { day_of_week, meal_type, title, description, calories, tags, image_url, is_active } = req.body;

    const result = await pool.query(
      `UPDATE weekly_menu_items 
       SET day_of_week = $1, 
           meal_type = $2, 
           title = $3, 
           description = $4, 
           calories = $5, 
           tags = $6, 
           image_url = $7,
           is_active = $8
       WHERE id = $9
       RETURNING *`,
      [
        day_of_week, 
        meal_type, 
        title, 
        description, 
        calories, 
        JSON.stringify(tags || []), 
        image_url,
        is_active ?? true, // Default to true if not provided
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ message: 'Server error updating item' });
  }
});

// ----------------------------------------------------------------------
// DELETE: Soft Delete or Hard Delete Menu Item
// ----------------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Option A: Hard Delete (Remove row completely)
    const result = await pool.query('DELETE FROM weekly_menu_items WHERE id = $1 RETURNING id', [id]);
    
    // Option B: Soft Delete (Just hide it) - Uncomment if preferred
    // const result = await pool.query('UPDATE weekly_menu_items SET is_active = false WHERE id = $1 RETURNING id', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ message: 'Menu item deleted successfully', id });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ message: 'Server error deleting item' });
  }
});

module.exports = router;