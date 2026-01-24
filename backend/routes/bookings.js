const express = require("express");
const pool = require("../db/db");
const { authenticateToken } = require("../middlewares/auth");
const { Cashfree } = require("cashfree-pg");

const router = express.Router();

// --- Cashfree Initialization ---
let cfConfig = {
    env: process.env.CASHFREE_ENV || 'SANDBOX',
    appId: process.env.CASHFREE_CLIENT_ID,
    secretKey: process.env.CASHFREE_SECRET_KEY,
};
const cashfree = new Cashfree(cfConfig);

/**
 * POST /create
 */
router.post("/create", authenticateToken, async (req, res) => {
  const { cart, cartTotal, addressId, paymentMethod } = req.body;
  const { userId, name, email, phone } = req.user;

  // --- 1. Basic Validation ---
  if (!cart || (!cart.lunch && !cart.dinner) || !cartTotal || !addressId || !paymentMethod) {
    return res.status(400).json({ success: false, error: "Missing required booking data." });
  }
   if (isNaN(parseFloat(cartTotal)) || (paymentMethod === 'online' && parseFloat(cartTotal) < 1)) {
     return res.status(400).json({ success: false, error: "Invalid cart total amount." });
   }

  const client = await pool.connect();
  let bookingId;

  try {
    await client.query("BEGIN");

    // --- 2. Create the Master Booking Record ---
    const bookingQuery = `
      INSERT INTO "bookings" (user_id, address_id, total_amount, payment_method, payment_status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING id
    `;
    const bookingResult = await client.query(bookingQuery, [userId, addressId, cartTotal, paymentMethod]);
    bookingId = bookingResult.rows[0].id;

    // --- 3. Prepare and Insert Booking Items ---
    const allItems = [
      ...(cart.lunch || []).map(item => ({ ...item, mealType: 'lunch' })),
      ...(cart.dinner || []).map(item => ({ ...item, mealType: 'dinner' })),
    ];
    
    if (allItems.length === 0) throw new Error("Cart is empty.");

    for (const item of allItems) {
      const itemQuery = `
        INSERT INTO "booking_items"
          (booking_id, product_id, quantity, subscription_plan_id, price_per_unit, total_price)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
      `;
      const pricePerUnit = item.plan ? item.plan.price : (item.base_price || 0);
      const planId = item.plan ? item.plan.id : null;

      const itemResult = await client.query(itemQuery, [
          bookingId,
          item.id,
          item.quantity,
          planId,
          pricePerUnit,
          item.totalPrice
      ]);
      item.booking_item_id = itemResult.rows[0].id;
    }

    // --- 4. Handle Payment Method ---
    if (paymentMethod === 'cod') {
      await client.query("UPDATE bookings SET payment_status = 'completed' WHERE id = $1", [bookingId]);
      await client.query("COMMIT");

      // PERFORMANCE CHANGE: Move delivery creation to the background
      // This allows the user to see the success screen immediately.
      setImmediate(() => {
        createDeliveriesForBooking(pool, bookingId, allItems)
          .catch(err => console.error(`Background Delivery Error for Booking ${bookingId}:`, err));
      });

      res.status(201).json({
        success: true,
        message: "Booking placed successfully!",
        bookingId: bookingId
      });

    } else if (paymentMethod === 'online') {
      const cashfreeOrderId = `BOOKING_${bookingId}_${Date.now()}`;
      await client.query('UPDATE "bookings" SET cashfree_order_id = $1 WHERE id = $2', [cashfreeOrderId, bookingId]);

      const request = {
        order_amount: parseFloat(cartTotal),
        order_currency: "INR",
        order_id: cashfreeOrderId,
        customer_details: {
          customer_id: userId.toString(),
          customer_name: name || "Guest",
          customer_email: email,
          customer_phone: phone
        },
        order_meta: {
          return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/order-success?booking_id=${bookingId}`
        },
      };

      const cashfreeResponse = await cashfree.orders.createOrder(request);

      if (!cashfreeResponse?.data?.payment_session_id) {
          throw new Error("Failed to get payment session ID from Cashfree.");
      }

      await client.query("COMMIT");

      res.status(201).json({
        success: true,
        message: "Booking created, redirecting to payment.",
        bookingId: bookingId,
        payment_session_id: cashfreeResponse.data.payment_session_id
      });
    }

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Booking Error:", err.message);
    res.status(500).json({ success: false, error: "Failed to create booking." });
  } finally {
    client.release();
  }
});

/**
 * Helper function: createDeliveriesForBooking
 * MODIFIED: Now uses the DB Pool directly to support background execution.
 */
async function createDeliveriesForBooking(dbPool, bookingId, bookingItems) {
  console.log(`[BG-PROCESS] Starting delivery creation for Booking: ${bookingId}`);
  
  try {
    const addressResult = await dbPool.query(`
      SELECT a.* FROM "addresses" a 
      JOIN "bookings" b ON a.id = b.address_id 
      WHERE b.id = $1`, [bookingId]);
    
    if (addressResult.rows.length === 0) return;
    const addressSnapshot = JSON.stringify(addressResult.rows[0]);

    for (const item of bookingItems) {
      const productResult = await dbPool.query('SELECT booking_type FROM "products" WHERE id = $1', [item.id]);
      if (productResult.rows.length === 0) continue;
      
      const product = productResult.rows[0];
      const slot = item.mealType === 'dinner' ? 'dinner' : 'lunch';

      if (product.booking_type === 'subscription' && item.plan && item.plan.id) {
        const planResult = await dbPool.query('SELECT duration_days FROM "subscription_plans" WHERE id = $1', [item.plan.id]);
        if (planResult.rows.length === 0) continue;
        
        const planDuration = planResult.rows[0].duration_days;
        let deliveryDate = new Date(item.startDate + 'T00:00:00');
        
        // Safety check for past dates
        const today = new Date();
        today.setHours(0,0,0,0);
        if (deliveryDate < today) {
            deliveryDate = new Date();
            deliveryDate.setDate(deliveryDate.getDate() + 1);
        }

        for (let i = 0; i < planDuration; i++) {
            await dbPool.query(
              `INSERT INTO "deliveries" (booking_item_id, delivery_date, delivery_slot, status, delivery_address, meal_type) 
               VALUES ($1, $2, $3, 'scheduled', $4, $5)`,
              [item.booking_item_id, deliveryDate.toISOString().split('T')[0], slot, addressSnapshot, item.mealType]
            );
            deliveryDate.setDate(deliveryDate.getDate() + 1);
        }
      }
    }
    console.log(`[BG-PROCESS] ✅ Deliveries created for Booking: ${bookingId}`);
  } catch (err) {
    console.error(`[BG-PROCESS] 🚨 Error creating deliveries:`, err.stack);
  }
}

// ... rest of your GET routes (/, /:id) remain exactly the same ...
module.exports = router;