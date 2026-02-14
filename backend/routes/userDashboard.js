//backend/routes/userDashboard.js
const express = require("express");
const pool = require("../db/db");
const { authenticateToken } = require("../middlewares/auth");
const redisClient = require("../lib/redis"); // Shared Redis client
const router = express.Router();

/**
 * Shared Helper: Cache Busting
 * Ensures all instances see fresh data after a change
 */
const clearUserCache = async (userId) => {
  await redisClient.del(`user:${userId}:next-delivery`);
  await redisClient.del(`user:${userId}:subscriptions`);
};

/**
 * [GET /api/userDashboard/next-delivery]
 * Fetches the immediate upcoming meal for the user dashboard.
 * Optimized with Redis Shared Caching (30m TTL).
 */
router.get("/next-delivery", authenticateToken, async (req, res, next) => {
  // DEBUG LOG: Show what we're getting
  console.log("🔍 [userDashboard/next-delivery] req.user:", req.user);
  console.log("🔍 [userDashboard/next-delivery] Using req.user.id:", req.user.id);
  
  const userId = req.user.id;
  const cacheKey = `user:${userId}:next-delivery`;

  try {
    // 1. Check Shared Cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log("🔍 [userDashboard/next-delivery] Cache HIT for user:", userId);
      return res.json({ success: true, data: JSON.parse(cached), source: 'cache' });
    }
    
    console.log("🔍 [userDashboard/next-delivery] Cache MISS for user:", userId);

    // 2. Database Fetch
    const query = `
      SELECT d.id as delivery_id, d.delivery_date, d.delivery_slot, d.status, d.meal_type,
             p.name as product_name, p.image_url, p.description as items_description
      FROM deliveries d
      JOIN booking_items bi ON d.booking_item_id = bi.id
      JOIN products p ON bi.product_id = p.id
      JOIN bookings b ON bi.booking_id = b.id
      WHERE b.user_id = $1 AND d.status = 'scheduled' AND d.delivery_date >= CURRENT_DATE 
      ORDER BY d.delivery_date ASC, d.delivery_slot ASC LIMIT 1`;
    
    console.log("🔍 [userDashboard/next-delivery] Executing query for user:", userId);
    const result = await pool.query(query, [userId]);
    console.log("🔍 [userDashboard/next-delivery] Query result rows:", result.rows.length);
    
    const data = result.rows.length > 0 ? result.rows[0] : null;

    // 3. Set Shared Cache
    await redisClient.setEx(cacheKey, 1800, JSON.stringify(data)); 
    console.log("🔍 [userDashboard/next-delivery] Cache SET for user:", userId);
    
    res.json({ success: true, data });
  } catch (err) {
    console.error("❌ [userDashboard/next-delivery] Error:", err.message);
    next(err); // Pass to Global Error Handler
  }
});

/**
 * [PUT /api/userDashboard/skip/:deliveryId]
 * Allows a user to skip a specific scheduled delivery.
 */
router.put("/skip/:deliveryId", authenticateToken, async (req, res, next) => {
  console.log("🔍 [userDashboard/skip] req.user:", req.user);
  console.log("🔍 [userDashboard/skip] Using req.user.id:", req.user.id);
  
  const { deliveryId } = req.params;
  const userId = req.user.id;

  try {
    // 1. Ownership & Status Validation
    const checkQuery = `
      SELECT d.id FROM deliveries d JOIN booking_items bi ON d.booking_item_id = bi.id
      JOIN bookings b ON bi.booking_id = b.id
      WHERE d.id = $1 AND b.user_id = $2 AND d.status = 'scheduled'`;
    
    console.log("🔍 [userDashboard/skip] Checking ownership for delivery:", deliveryId);
    const checkResult = await pool.query(checkQuery, [deliveryId, userId]);
    
    if (checkResult.rows.length === 0) {
      console.error("❌ [userDashboard/skip] Meal not found or not owned by user");
      const error = new Error("Meal not found or already processed.");
      error.statusCode = 404;
      return next(error);
    }

    // 2. Update Status
    console.log("🔍 [userDashboard/skip] Updating delivery status to 'skipped'");
    await pool.query("UPDATE deliveries SET status = 'skipped' WHERE id = $1", [deliveryId]);
    
    // 3. ATOMIC CACHE BUSTING
    console.log("🔍 [userDashboard/skip] Clearing cache for user:", userId);
    await clearUserCache(userId);

    res.json({ success: true, message: "Meal skipped successfully." });
  } catch (err) {
    console.error("❌ [userDashboard/skip] Error:", err.message);
    next(err);
  }
});

/**
 * [GET /api/userDashboard/subscriptions]
 * Fetches all active subscription plans and meal balance.
 */
router.get("/subscriptions", authenticateToken, async (req, res, next) => {
  // DEBUG LOG: Show what we're getting
  console.log("🔍 [userDashboard/subscriptions] req.user:", req.user);
  console.log("🔍 [userDashboard/subscriptions] Using req.user.id:", req.user.id);
  
  const userId = req.user.id;
  const cacheKey = `user:${userId}:subscriptions`; // ✅ FIXED: Changed from 'id' to 'userId'

  try {
    // 1. Check Shared Cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log("🔍 [userDashboard/subscriptions] Cache HIT for user:", userId);
      return res.json({ success: true, data: JSON.parse(cached), source: 'cache' });
    }
    
    console.log("🔍 [userDashboard/subscriptions] Cache MISS for user:", userId);

    // 2. Aggregated Subscription Fetch
    const query = `
      SELECT DISTINCT bi.id as booking_item_id, p.name as product_name, p.image_url, sp.plan_name,
      (SELECT meal_type FROM deliveries d WHERE d.booking_item_id = bi.id LIMIT 1) as meal_type,
      (SELECT delivery_address FROM deliveries d WHERE d.booking_item_id = bi.id LIMIT 1) as delivery_address,
      (SELECT COUNT(*) FROM deliveries d2 WHERE d2.booking_item_id = bi.id AND d2.status = 'scheduled') as remaining_meals,
      (SELECT MIN(delivery_date) FROM deliveries d3 WHERE d3.booking_item_id = bi.id) as start_date,
      (SELECT MAX(delivery_date) FROM deliveries d4 WHERE d4.booking_item_id = bi.id) as end_date
      FROM bookings b
      JOIN booking_items bi ON b.id = bi.booking_id
      JOIN products p ON bi.product_id = p.id
      LEFT JOIN subscription_plans sp ON bi.subscription_plan_id = sp.id
      WHERE b.user_id = $1 AND b.payment_status = 'completed'
      ORDER BY start_date DESC`;
    
    console.log("🔍 [userDashboard/subscriptions] Executing query for user:", userId);
    const result = await pool.query(query, [userId]);
    console.log("🔍 [userDashboard/subscriptions] Query result rows:", result.rows.length);

    // 3. Set Shared Cache (1 hour)
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(result.rows));
    console.log("🔍 [userDashboard/subscriptions] Cache SET for user:", userId);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("❌ [userDashboard/subscriptions] Error:", err.message);
    next(err);
  }
});

// ==========================================
// ADD THIS NEW ROUTE FOR ORDER HISTORY
// ==========================================

/**
 * [GET /api/userDashboard/bookings]
 * Fetches user's order history (for OrderHistoryClient)
 * This should be in userDashboard.js, not bookings.js
 */
router.get("/bookings", authenticateToken, async (req, res, next) => {
  console.log("🔍 [userDashboard/bookings] req.user:", req.user);
  console.log("🔍 [userDashboard/bookings] Using req.user.id:", req.user.id);
  
  const userId = req.user.id;
  
  try {
    const query = `
      SELECT 
        id,
        created_at,
        total_amount,
        payment_method,
        payment_status,
        notes
      FROM bookings
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50`;
    
    console.log("🔍 [userDashboard/bookings] Executing query for user:", userId);
    const result = await pool.query(query, [userId]);
    console.log("🔍 [userDashboard/bookings] Query result rows:", result.rows.length);
    
    res.json({ 
      success: true, 
      data: result.rows 
    });
    
  } catch (err) {
    console.error("❌ [userDashboard/bookings] Error:", err.message);
    next(err);
  }
});

// Add these new routes after existing ones

/**
 * [GET /api/userDashboard/enhanced-subscriptions]
 * Fetches subscriptions with delivery schedule and payment info
 */
router.get("/enhanced-subscriptions", authenticateToken, async (req, res, next) => {
  console.log("🔍 [userDashboard/enhanced-subscriptions] req.user:", req.user);
  
  const userId = req.user.id;
  const cacheKey = `user:${userId}:enhanced-subscriptions`;

  try {
    // Check cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: JSON.parse(cached), source: 'cache' });
    }

    // Enhanced query with delivery schedule and payment info
    const query = `
      SELECT DISTINCT 
        bi.id as booking_item_id,
        p.name as product_name,
        p.image_url,
        sp.plan_name,
        sp.duration_days,
        sp.price as plan_price,
        b.payment_method,
        b.payment_status,
        b.total_amount,
        b.created_at as booking_date,
        
        -- Delivery info
        (SELECT meal_type FROM deliveries d WHERE d.booking_item_id = bi.id LIMIT 1) as meal_type,
        (SELECT delivery_address FROM deliveries d WHERE d.booking_item_id = bi.id LIMIT 1) as delivery_address,
        
        -- Calculate remaining meals
        (SELECT COUNT(*) FROM deliveries d2 
         WHERE d2.booking_item_id = bi.id 
         AND d2.status = 'scheduled'
         AND d2.delivery_date >= CURRENT_DATE) as remaining_meals,
        
        -- Get delivery schedule (unique delivery days)
        (SELECT json_agg(DISTINCT EXTRACT(DOW FROM delivery_date)) 
         FROM deliveries d3 
         WHERE d3.booking_item_id = bi.id 
         AND d3.status = 'scheduled') as delivery_days_index,
        
        -- Get total meals in subscription
        (SELECT COUNT(*) FROM deliveries d4 WHERE d4.booking_item_id = bi.id) as total_meals,
        
        -- Get start and end dates
        (SELECT MIN(delivery_date) FROM deliveries d5 WHERE d5.booking_item_id = bi.id) as start_date,
        (SELECT MAX(delivery_date) FROM deliveries d6 WHERE d6.booking_item_id = bi.id) as end_date
        
      FROM bookings b
      JOIN booking_items bi ON b.id = bi.booking_id
      JOIN products p ON bi.product_id = p.id
      LEFT JOIN subscription_plans sp ON bi.subscription_plan_id = sp.id
      WHERE b.user_id = $1 
        AND b.payment_status = 'completed'
        AND EXISTS (
          SELECT 1 FROM deliveries d 
          WHERE d.booking_item_id = bi.id 
          AND d.delivery_date >= CURRENT_DATE 
          AND d.status = 'scheduled'
        )
      ORDER BY start_date DESC`;
    
    const result = await pool.query(query, [userId]);
    
    // Format delivery days index (0=Sunday, 1=Monday, etc.) to day names
    const formattedData = result.rows.map(sub => {
      const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      let deliveryDays = [];
      
      if (sub.delivery_days_index) {
        try {
          const daysIndex = JSON.parse(sub.delivery_days_index);
          if (Array.isArray(daysIndex)) {
            deliveryDays = daysIndex.map(index => daysMap[index] || 'Unknown');
          }
        } catch (e) {
          console.error('Error parsing delivery days:', e);
        }
      }
      
      return {
        ...sub,
        delivery_days: deliveryDays,
        frequency: deliveryDays.length > 0 ? `${deliveryDays.length} days/week` : 'Custom schedule'
      };
    });

    // Cache for 30 minutes
    await redisClient.setEx(cacheKey, 1800, JSON.stringify(formattedData));
    
    res.json({ success: true, data: formattedData });
    
  } catch (err) {
    console.error("❌ [userDashboard/enhanced-subscriptions] Error:", err.message);
    next(err);
  }
});

/**
 * [GET /api/userDashboard/recent-activity]
 * Fetches recent user activity from deliveries and bookings
 */
router.get("/recent-activity", authenticateToken, async (req, res, next) => {
  console.log("🔍 [userDashboard/recent-activity] req.user:", req.user);
  
  const userId = req.user.id;

  try {
    const query = `
      (
        -- Activity from deliveries (skipped, delivered, etc.)
        SELECT 
          d.id as activity_id,
          'delivery' as activity_type,
          CASE 
            WHEN d.status = 'skipped' THEN CONCAT('Skipped ', d.meal_type, ' meal')
            WHEN d.status = 'delivered' THEN CONCAT(d.meal_type, ' meal delivered')
            WHEN d.status = 'out_for_delivery' THEN CONCAT(d.meal_type, ' meal is out for delivery')
            ELSE CONCAT(d.meal_type, ' meal ', d.status)
          END as action,
          d.delivery_date as activity_date,
          d.status as status,
          NULL as payment_method,
          NULL as payment_status
        FROM deliveries d
        JOIN booking_items bi ON d.booking_item_id = bi.id
        JOIN bookings b ON bi.booking_id = b.id
        WHERE b.user_id = $1 
          AND d.status IN ('skipped', 'delivered', 'out_for_delivery')
          AND d.delivery_date >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY d.delivery_date DESC
        LIMIT 10
      )
      UNION ALL
      (
        -- Activity from bookings (order placed, payment completed)
        SELECT 
          b.id as activity_id,
          'booking' as activity_type,
          CASE 
            WHEN b.payment_status = 'completed' THEN 'Order placed - Payment completed'
            WHEN b.payment_status = 'pending' THEN 'Order placed - Payment pending'
            ELSE CONCAT('Order ', b.payment_status)
          END as action,
          b.created_at as activity_date,
          NULL as status,
          b.payment_method,
          b.payment_status
        FROM bookings b
        WHERE b.user_id = $1 
          AND b.created_at >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY b.created_at DESC
        LIMIT 10
      )
      ORDER BY activity_date DESC
      LIMIT 15`;
    
    const result = await pool.query(query, [userId]);
    
    res.json({ 
      success: true, 
      data: result.rows 
    });
    
  } catch (err) {
    console.error("❌ [userDashboard/recent-activity] Error:", err.message);
    next(err);
  }
});

/**
 * [GET /api/userDashboard/upcoming-schedule]
 * Fetches upcoming delivery schedule for next 7 days
 */
router.get("/upcoming-schedule", authenticateToken, async (req, res, next) => {
  console.log("🔍 [userDashboard/upcoming-schedule] req.user:", req.user);
  
  const userId = req.user.id;

  try {
    const query = `
      SELECT 
        d.id,
        d.delivery_date,
        d.delivery_slot,
        d.status,
        d.meal_type,
        p.name as product_name,
        sp.plan_name,
        d.delivery_address
      FROM deliveries d
      JOIN booking_items bi ON d.booking_item_id = bi.id
      JOIN bookings b ON bi.booking_id = b.id
      JOIN products p ON bi.product_id = p.id
      LEFT JOIN subscription_plans sp ON bi.subscription_plan_id = sp.id
      WHERE b.user_id = $1 
        AND d.delivery_date >= CURRENT_DATE 
        AND d.delivery_date <= CURRENT_DATE + INTERVAL '7 days'
        AND d.status = 'scheduled'
      ORDER BY d.delivery_date, 
        CASE d.delivery_slot 
          WHEN 'lunch' THEN 1 
          WHEN 'dinner' THEN 2 
          ELSE 3 
        END`;
    
    const result = await pool.query(query, [userId]);
    
    res.json({ 
      success: true, 
      data: result.rows 
    });
    
  } catch (err) {
    console.error("❌ [userDashboard/upcoming-schedule] Error:", err.message);
    next(err);
  }
});

// GET /api/userDashboard/enhanced-subscriptions
router.get('/enhanced-subscriptions', authenticateToken, async (req, res) => {
  try {
    // 🛡️ ROBUST ID EXTRACTION (The Fix)
    // This handles all cases: if req.user is a String OR an Object
    let userId = null;
    
    if (req.user && typeof req.user === 'string') {
      userId = req.user;
    } else if (req.user && req.user.id) {
      userId = req.user.id;
    } else if (req.user && req.user.userId) {
      userId = req.user.userId;
    }

    // Safety check
    if (!userId) {
      console.error("❌ User ID missing in token:", req.user);
      return res.status(401).json({ success: false, error: "Invalid Token Data" });
    }

    // 🔒 Force String Type to prevent "JSON Operator" crash
    userId = String(userId); 

    const query = `
      SELECT 
        b.id::text, 
        
        -- Product Details
        p.name as product_name,
        p.image_url,
        
        -- Plan Details
        COALESCE(sp.plan_name, 'Standard Plan') as plan_name,
        
        -- Meal Counts
        bi.quantity as total_meals,
        bi.quantity as remaining_meals,
        
        -- Status & Money
        b.payment_status::text as status,
        b.total_amount::text,
        b.created_at as start_date
        
      FROM bookings b
      JOIN booking_items bi ON b.id = bi.booking_id
      JOIN products p ON bi.product_id = p.id
      LEFT JOIN subscription_plans sp ON bi.subscription_plan_id = sp.id
      
      WHERE 
        b.user_id::text = $1::text -- Robust comparison
      ORDER BY b.created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    
    res.json({
      success: true,
      data: result.rows
    });

  } catch (err) {
    console.error('❌ Enhanced Subs Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;