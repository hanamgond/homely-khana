const express = require("express");
const pool = require("../db/db");
const { authenticateToken } = require("../middlewares/auth");
const router = express.Router();

/**
 * 1. GET /next-delivery
 * Fetches the immediate next scheduled delivery for the "Today's Meal" card.
 * Joins multiple tables to get product details (image, name) and delivery status.
 */
router.get("/next-delivery", authenticateToken, async (req, res) => {
  const { userId } = req.user;
  try {
    const query = `
      SELECT 
        d.id as delivery_id, 
        d.delivery_date, 
        d.delivery_slot, 
        d.status, 
        d.meal_type,
        p.name as product_name, 
        p.image_url, 
        p.description as items_description
      FROM deliveries d
      JOIN booking_items bi ON d.booking_item_id = bi.id
      JOIN products p ON bi.product_id = p.id
      JOIN bookings b ON bi.booking_id = b.id
      WHERE b.user_id = $1
        AND d.status = 'scheduled'
        AND d.delivery_date >= CURRENT_DATE 
      ORDER BY d.delivery_date ASC, d.delivery_slot ASC
      LIMIT 1
    `;
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return res.json({ success: true, data: null }); // No upcoming meals found
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Error fetching next delivery:", err);
    res.status(500).json({ success: false, error: "Server error fetching next delivery" });
  }
});

/**
 * 2. PUT /skip/:deliveryId
 * Allows a user to skip a specific scheduled meal.
 * Includes a check to ensure the delivery actually belongs to the user.
 */
router.put("/skip/:deliveryId", authenticateToken, async (req, res) => {
  const { deliveryId } = req.params;
  const { userId } = req.user;

  try {
    // Validate ownership before updating
    const checkQuery = `
      SELECT d.id FROM deliveries d
      JOIN booking_items bi ON d.booking_item_id = bi.id
      JOIN bookings b ON bi.booking_id = b.id
      WHERE d.id = $1 AND b.user_id = $2 AND d.status = 'scheduled'
    `;
    const checkResult = await pool.query(checkQuery, [deliveryId, userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Delivery not found or cannot be skipped." });
    }

    // Mark as skipped
    await pool.query("UPDATE deliveries SET status = 'skipped' WHERE id = $1", [deliveryId]);
    res.json({ success: true, message: "Meal skipped successfully." });
  } catch (err) {
    console.error("Error skipping meal:", err);
    res.status(500).json({ success: false, error: "Server error skipping meal" });
  }
});

/**
 * 3. GET /subscriptions
 * Fetches all active subscriptions for the "My Subscriptions" page.
 * Returns details including plan name, start/end dates, remaining meal count, 
 * and the specific address used for that subscription.
 */
router.get("/subscriptions", authenticateToken, async (req, res) => {
  const { userId } = req.user;
  try {
    const query = `
      SELECT DISTINCT 
        bi.id as booking_item_id,
        p.name as product_name, 
        p.image_url,
        sp.plan_name,
        
        -- Get Meal Type (Lunch/Dinner) from one of the deliveries associated with this item
        (SELECT meal_type FROM deliveries d WHERE d.booking_item_id = bi.id LIMIT 1) as meal_type,
        
        -- Get Address Snapshot from deliveries
        (SELECT delivery_address FROM deliveries d WHERE d.booking_item_id = bi.id LIMIT 1) as delivery_address,

        -- Count remaining scheduled meals
        (SELECT COUNT(*) FROM deliveries d2 WHERE d2.booking_item_id = bi.id AND d2.status = 'scheduled') as remaining_meals,
        
        -- Calculate Start and End dates based on delivery range
        (SELECT MIN(delivery_date) FROM deliveries d3 WHERE d3.booking_item_id = bi.id) as start_date,
        (SELECT MAX(delivery_date) FROM deliveries d4 WHERE d4.booking_item_id = bi.id) as end_date

      FROM bookings b
      JOIN booking_items bi ON b.id = bi.booking_id
      JOIN products p ON bi.product_id = p.id
      LEFT JOIN subscription_plans sp ON bi.subscription_plan_id = sp.id
      WHERE b.user_id = $1 AND b.payment_status = 'completed'
      ORDER BY start_date DESC
    `;
    const result = await pool.query(query, [userId]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Error fetching subscriptions:", err);
    res.status(500).json({ success: false, error: "Server error fetching subscriptions" });
  }
});

module.exports = router;