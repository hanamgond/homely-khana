if (process.env.NODE_ENV !== "production") {
  require('dotenv').config()
}

const express = require("express");
const pool = require("../db/db");
const redisClient = require("../lib/redis"); // Shared Redis client for cache busting
const router = express.Router();

/**
 * POST /webhook
 * Secures the Cashfree payment lifecycle and triggers delivery fulfillment.
 */
router.post("/webhook", async (req, res, next) => {
  // Cashfree webhooks can be noisy; using a dedicated try/catch or next(err) is vital
  try {
    const { payment, order } = req.body.data;

    if (payment.payment_status === "SUCCESS") {
      const cashfreeOrderId = order.order_id;
      const client = await pool.connect();
      
      try {
        await client.query("BEGIN");
        
        // 1. Update Booking Status
        const updateResult = await client.query(
          `UPDATE "bookings" 
           SET payment_status = 'completed', updated_at = CURRENT_TIMESTAMP
           WHERE cashfree_order_id = $1 AND payment_status = 'pending'
           RETURNING id, user_id`, // Added user_id for cache busting
          [cashfreeOrderId]
        );
        
        if (updateResult.rows.length === 0) {
          await client.query("ROLLBACK");
          return res.status(200).send("OK (Already Processed)");
        }
        
        const { id: bookingId, user_id: userId } = updateResult.rows[0];
        
        // 2. Fulfillment: Create Delivery Records
        await createDeliveriesForBooking(client, bookingId);
        
        // 3. Commit Transaction
        await client.query("COMMIT");

        // 4. SHARED CACHE BUSTING: Ensure all 10 instances show fresh data
        await redisClient.del(`user:${userId}:subscriptions`);
        await redisClient.del(`user:${userId}:next-delivery`);
        
        res.status(200).send("OK");
        
      } catch (err) {
        await client.query("ROLLBACK");
        next(err); // Pass to Global Error Handler for structured logging
      } finally {
        client.release();
      }
    } else {
      res.status(200).send("OK (Payment Not Success)");
    }
  } catch (err) {
    // Webhook payload errors should be 400s
    const error = new Error("Invalid Webhook Payload");
    error.statusCode = 400;
    next(error);
  }
});

/**
 * HELPER FUNCTION: CREATE DELIVERIES FOR A BOOKING
 */
async function createDeliveriesForBooking(client, bookingId) {
  // 1. Fetch Items
  const itemsResult = await client.query(
    'SELECT * FROM "booking_items" WHERE booking_id = $1',
    [bookingId]
  );
  
  // 2. Fetch Address Snapshot
  const addressResult = await client.query(
    `SELECT a.* FROM "addresses" a
     JOIN "bookings" b ON a.id = b.address_id
     WHERE b.id = $1`,
     [bookingId]
  );
  
  if (addressResult.rows.length === 0) {
      throw new Error(`Critical: No address found for booking ${bookingId}`);
  }
  const addressSnapshot = JSON.stringify(addressResult.rows[0]);

  for (const item of itemsResult.rows) {
    const productResult = await client.query(
      'SELECT booking_type FROM "products" WHERE id = $1',
      [item.product_id]
    );
    const product = productResult.rows[0];

    // Default slotting logic
    let slot = 'lunch'; 
    let meal_type = 'lunch';

    if (product.booking_type === 'one-time') {
      for (let i = 0; i < item.quantity; i++) {
        await client.query(
          `INSERT INTO "deliveries" (booking_item_id, delivery_date, delivery_slot, status, delivery_address, meal_type)
           VALUES ($1, CURRENT_DATE, $2, 'scheduled', $3, $4)`,
          [item.id, slot, addressSnapshot, meal_type]
        );
      }
    } else if (product.booking_type === 'subscription') {
      const planResult = await client.query(
        'SELECT duration_days, meals_per_day FROM "subscription_plans" WHERE id = $1',
        [item.subscription_plan_id]
      );
      
      const plan = planResult.rows[0];
      const totalDays = plan.duration_days;
      let deliveryDate = new Date();
      
      for (let i = 0; i < totalDays; i++) {
        await client.query(
          `INSERT INTO "deliveries" (booking_item_id, delivery_date, delivery_slot, status, delivery_address, meal_type)
           VALUES ($1, $2, $3, 'scheduled', $4, $5)`,
          [item.id, deliveryDate.toISOString().split('T')[0], slot, addressSnapshot, meal_type]
        );
        deliveryDate.setDate(deliveryDate.getDate() + 1);
      }
    }
  }
}

module.exports = router;