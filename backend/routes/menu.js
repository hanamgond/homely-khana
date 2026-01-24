const express = require('express');
const router = express.Router();
const pool = require('../db/db');
const NodeCache = require("node-cache");

// Initialize cache: 10 minute TTL (600 seconds)
const menuCache = new NodeCache({ stdTTL: 600 });

// Helper to clear cache when data changes
const clearMenuCache = () => menuCache.del("weekly_menu");

const fetchMenuLogic = async (req, res) => {
  try {
    // 1. Check Cache first
    const cachedData = menuCache.get("weekly_menu");
    if (cachedData) {
      return res.json({ success: true, data: cachedData, source: 'cache' });
    }

    // 2. Database Fetch
    const result = await pool.query(`
      SELECT * FROM weekly_menu_items 
      WHERE is_active = true 
      ORDER BY 
        CASE day_of_week
          WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
          WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6
          WHEN 'Sunday' THEN 7
        END ASC,
        CASE meal_type WHEN 'Lunch' THEN 1 WHEN 'Dinner' THEN 2 ELSE 3 END ASC
    `);
    
    const safeRows = result.rows.map(row => ({
        ...row,
        tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || [])
    }));

    // 3. Set Cache
    menuCache.set("weekly_menu", safeRows);

    res.json({ success: true, data: safeRows });
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

router.get('/', fetchMenuLogic);
router.get('/weekly', fetchMenuLogic);

// ADMIN ROUTES: Must clear cache on changes
router.post('/add', async (req, res) => {
  try {
    const { day_of_week, meal_type, title, description, price, is_veg, calories, tags, image_url } = req.body;
    const result = await pool.query(
      `INSERT INTO weekly_menu_items (...) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true) RETURNING *`,
      [day_of_week, meal_type, title, description, price || 120, is_veg ?? true, calories, JSON.stringify(tags || []), image_url]
    );
    
    clearMenuCache(); // Cache invalidated
    res.status(201).json({ success: true, item: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.put('/update/:id', async (req, res) => {
  /* ... existing logic ... */
  clearMenuCache();
  res.json({ success: true });
});

router.delete('/delete/:id', async (req, res) => {
  /* ... existing logic ... */
  clearMenuCache();
  res.json({ success: true });
});

module.exports = router;