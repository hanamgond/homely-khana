// backend/routes/payment.js
if (process.env.NODE_ENV !== "production") {
  require('dotenv').config()
}

const express = require("express");
const pool = require("../db/db");
const router = express.Router();
// NOTE: We don't need cashfree-pg here, just the webhook logic

/**
 * POST /webhook
 * This is the secure endpoint Cashfree will call *after* a payment is completed.
 * Its job is to:
 * 1. Verify the payment was successful.
 * 2. Update the booking status from 'pending' to 'completed'.
 * 3. Trigger the creation of all 'deliveries' records for that booking.
 */
router.post("/webhook", async (req, res) => {
  
  try {
    const { payment, order } = req.body.data;

    // 1. Verify payment status
    if (payment.payment_status === "SUCCESS") {
      const cashfreeOrderId = order.order_id; // This is our 'BOOKING_...' ID

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        
        // 2. Find the booking and update its status
        const updateResult = await client.query(
          `UPDATE "bookings" 
           SET payment_status = 'completed', updated_at = CURRENT_TIMESTAMP
           WHERE cashfree_order_id = $1 AND payment_status = 'pending'
           RETURNING id`, // Return the booking ID
          [cashfreeOrderId]
        );
        
        if (updateResult.rows.length === 0) {
          // This payment might be a duplicate or for a booking not in 'pending' status
          console.warn(`Webhook received for non-pending or unknown order: ${cashfreeOrderId}`);
          await client.query("ROLLBACK");
          return res.status(200).send("OK (Already Processed)");
        }
        
        const bookingId = updateResult.rows[0].id;
        
        // 3. Trigger the creation of 'deliveries'
        // This is the most critical step
        await createDeliveriesForBooking(client, bookingId);
        
        // 4. Commit all changes
        await client.query("COMMIT");
        console.log(`Successfully processed webhook for booking ${bookingId}`);
        
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`Webhook processing failed for order ${cashfreeOrderId}:`, err.stack);
        return res.status(500).send("Webhook processing error");
      } finally {
        client.release();
      }
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("Webhook payload error:", err.message);
    res.status(400).send("Invalid payload");
  }
});


/**
 * HELPER FUNCTION: CREATE DELIVERIES FOR A BOOKING
 * This is the core logic that turns a "booking" into physical "deliveries".
 * It's called *after* a payment is confirmed.
 */
async function createDeliveriesForBooking(client, bookingId) {
  console.log(`Starting to create deliveries for booking: ${bookingId}`);
  
  // 1. Get all items for this booking
  const itemsResult = await client.query(
    'SELECT * FROM "booking_items" WHERE booking_id = $1',
    [bookingId]
  );
  const bookingItems = itemsResult.rows;
  
  // 2. Get the booking's address snapshot
  const addressResult = await client.query(
    `SELECT a.* FROM "addresses" a
     JOIN "bookings" b ON a.id = b.address_id
     WHERE b.id = $1`,
     [bookingId]
  );
  
  if (addressResult.rows.length === 0) {
      throw new Error(`No address found for booking ID ${bookingId}`);
  }
  const addressSnapshot = JSON.stringify(addressResult.rows[0]); // Store as JSONB

  for (const item of bookingItems) {
    // 3. Get the product details for this item
    const productResult = await client.query(
      'SELECT * FROM "products" WHERE id = $1',
      [item.product_id]
    );
    const product = productResult.rows[0];

    // 4. Get the delivery slot (this is simplified)
    // TODO: This logic should be expanded to read from the cart data
    let slot = 'asap';
    let meal_type = null;
    if (product.booking_type === 'subscription') {
        slot = 'lunch'; // Default to lunch
        meal_type = 'lunch';
    }

    if (product.booking_type === 'one-time') {
      // Create 1 delivery for each *quantity* of the item
      for (let i = 0; i < item.quantity; i++) {
        await client.query(
          `INSERT INTO "deliveries" (booking_item_id, delivery_date, delivery_slot, status, delivery_address, meal_type)
           VALUES ($1, $2, $3, 'scheduled', $4, $5)`,
          [item.id, new Date(), slot, addressSnapshot, meal_type] // Default to today
        );
      }
    } else if (product.booking_type === 'subscription') {
      // Get the plan details
      const planResult = await client.query(
        'SELECT * FROM "subscription_plans" WHERE id = $1',
        [item.subscription_plan_id]
      );
      const plan = planResult.rows[0];
      const totalDeliveries = plan.duration_days * plan.meals_per_day;

      let deliveryDate = new Date(); // TODO: Get start date from cart
      
      for (let i = 0; i < totalDeliveries; i++) {
        // TODO: Add logic to skip weekends if needed
        await client.query(
          `INSERT INTO "deliveries" (booking_item_id, delivery_date, delivery_slot, status, delivery_address, meal_type)
           VALUES ($1, $2, $3, 'scheduled', $4, $5)`,
          [item.id, deliveryDate, slot, addressSnapshot, meal_type]
        );
        // Increment the date for the next delivery
        deliveryDate.setDate(deliveryDate.getDate() + 1);
      }
    }
  }
  console.log(`Successfully created deliveries for booking: ${bookingId}`);
}


module.exports = router;