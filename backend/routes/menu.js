//backend/routes/menu.js

const express = require('express');
const router = express.Router();
const pool = require('../db/db');
const redisClient = require("../lib/redis"); // Using the shared Redis client
const { authenticateAdmin } = require('../middlewares/auth');
const { z } = require('zod');

// --- 1. Zod Validation Schema ---
const menuItemSchema = z.object({
  day_of_week: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  meal_type: z.enum(['Lunch', 'Dinner']),
  title: z.string().min(1).trim(),
  description: z.string().optional().default(''),
  price: z.number().min(0).default(120),
  is_veg: z.boolean().default(true),
  calories: z.number().optional().nullable(),
  tags: z.array(z.string()).default([]),
  image_url: z.string().optional().nullable()
});

const MENU_CACHE_KEY = "homely_khana:weekly_menu";

// --- 2. Shared Cache Busting Logic ---
const clearMenuCache = async () => {
  await redisClient.del(MENU_CACHE_KEY);
};

/**
 * [GET /api/menu]
 * Fetches the weekly menu with Redis Caching
 */
const fetchMenuLogic = async (req, res, next) => {
  try {
    // 1. Check Shared Redis Cache first
    const cachedData = await redisClient.get(MENU_CACHE_KEY);
    if (cachedData) {
      return res.json({ success: true, data: JSON.parse(cachedData), source: 'redis' });
    }

    // 2. Database Fetch with Sorted Logic
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

    // 3. Set Shared Cache (TTL: 1 hour)
    await redisClient.setEx(MENU_CACHE_KEY, 3600, JSON.stringify(safeRows));

    res.json({ success: true, data: safeRows });
  } catch (error) {
    next(error); // Pass to Global Error Handler
  }
};

router.get('/', fetchMenuLogic);
router.get('/weekly', fetchMenuLogic);

// --- 3. ADMIN ROUTES (Protected) ---

router.post('/add', authenticateAdmin, async (req, res, next) => {
  const validation = menuItemSchema.safeParse(req.body);
  if (!validation.success) {
    const error = new Error("Invalid menu data");
    error.statusCode = 400;
    error.details = validation.error.errors;
    return next(error);
  }

  const { day_of_week, meal_type, title, description, price, is_veg, calories, tags, image_url } = validation.data;

  try {
    const result = await pool.query(
      `INSERT INTO weekly_menu_items 
       (day_of_week, meal_type, title, description, price, is_veg, calories, tags, image_url, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true) RETURNING *`,
      [day_of_week, meal_type, title, description, price, is_veg, calories, JSON.stringify(tags), image_url]
    );
    
    await clearMenuCache(); // Invalidate Redis across all 10 instances
    res.status(201).json({ success: true, item: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.delete('/delete/:id', authenticateAdmin, async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM weekly_menu_items WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      const error = new Error("Item not found");
      error.statusCode = 404;
      return next(error);
    }
    await clearMenuCache();
    res.json({ success: true, message: "Menu item deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;