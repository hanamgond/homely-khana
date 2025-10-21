// backend/routes/bookings.js
const express = require("express");
const pool = require("../db/db");
const authenticateToken = require("../middlewares/auth");
const { Cashfree, CFEnvironment } = require("cashfree-pg");

const router = express.Router();

// Initialize Cashfree
const cashfree = new Cashfree(
  CFEnvironment.SANDBOX,
  process.env.CASHFREE_TEST_CLIENT_ID,
  process.env.CASHFREE_TEST_CLIENT_SECRET
);

/**
 * POST /create
 * This is the single most important endpoint in the app.
 * It's called when the user clicks "Place Order" on the checkout page.
 * It follows the "Pending Booking Flow" we designed.
 */
router.post("/create", authenticateToken, async (req, res) => {
  const { cart, cartTotal, addressId, paymentMethod } = req.body;
  const { userId, name, email, phone } = req.user; // Get user details from token

  // 1. Validation
  if (!cart || (!cart.lunch && !cart.dinner) || !cartTotal || !addressId || !paymentMethod) {
    return res.status(400).json({ success: false, error: "Missing required booking data." });
  }

  const client = await pool.connect();
  let bookingId; // We need to capture this to send to Cashfree

  try {
    await client.query("BEGIN"); // Start a database transaction

    // 2. Create the master 'bookings' record
    const bookingQuery = `
      INSERT INTO "bookings" (user_id, address_id, total_amount, payment_method, payment_status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING id, created_at
    `;
    const bookingResult = await client.query(bookingQuery, [userId, addressId, cartTotal, paymentMethod]);
    bookingId = bookingResult.rows[0].id;
    const bookingTimestamp = bookingResult.rows[0].created_at;

    // 3. Create the 'booking_items' (the "receipt" items)
    // We combine lunch and dinner carts into one list of items to process
    const allItems = [
      ...(cart.lunch || []).map(item => ({ ...item, meal_type: 'lunch' })),
      ...(cart.dinner || []).map(item => ({ ...item, meal_type: 'dinner' })),
    ];

    for (const item of allItems) {
      const itemQuery = `
        INSERT INTO "booking_items" 
          (booking_id, product_id, quantity, subscription_plan_id, price_per_unit, total_price)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      // Note: We'll store meal_type on the 'delivery' record, not here.
      // But we need to get the correct price (either plan price or base price)
      const price = item.plan ? item.plan.price : item.base_price;
      const planId = item.plan ? item.plan.id : null;

      await client.query(itemQuery, [bookingId, item.id, item.quantity, planId, price, item.totalPrice]);
    }
    
    // 4. Handle Payment
    if (paymentMethod === 'cod') {
      // For Cash on Delivery, we are done. Commit the transaction.
      // We'll create the 'deliveries' via the webhook logic for consistency,
      // so we'll simulate a 'successful' payment webhook.
      await client.query("COMMIT");
      
      // We manually call the logic to create deliveries for COD
      // In a real production app, this might go into a job queue
      await createDeliveriesForBooking(client, bookingId);
      
      res.status(201).json({ 
        success: true, 
        message: "Booking placed successfully!", 
        bookingId: bookingId,
        payment_session_id: null 
      });

    } else if (paymentMethod === 'online') {
      // For Online Payment, we create a Cashfree order
      
      // Use the bookingId as the cashfree_order_id for easy tracking
      const cashfreeOrderId = `BOOKING_${bookingId}`;

      // Update our booking with the cashfree_order_id
      await client.query(
        'UPDATE "bookings" SET cashfree_order_id = $1 WHERE id = $2',
        [cashfreeOrderId, bookingId]
      );
        
      const request = {
        "order_amount": cartTotal,
        "order_currency": "INR",
        "order_id": cashfreeOrderId, // Send our unique ID to Cashfree
        "customer_details": {
          "customer_id": userId,
          "customer_name": name,
          "customer_email": email,
          "customer_phone": phone
        },
        "order_meta": {
          "return_url": `https://homelykhana.in/booking-status?booking_id=${bookingId}`
        },
      };

      const cashfreeResponse = await cashfree.PGCreateOrder(request);
      const payment_session_id = cashfreeResponse.data.payment_session_id;

      // Commit the transaction *only after* getting a successful response from Cashfree
      await client.query("COMMIT");
      
      res.status(201).json({ 
        success: true, 
        message: "Booking created. Redirecting to payment.", 
        bookingId: bookingId,
        payment_session_id: payment_session_id // Send this to the frontend
      });
    }

  } catch (err) {
    await client.query("ROLLBACK"); // If anything fails, undo all database changes
    console.error("Error creating booking:", err.stack);
    // Check if it's a Cashfree error
    if (err.response) {
      console.error("Cashfree Error:", err.response.data);
      return res.status(500).json({ success: false, error: err.response.data.message || "Payment gateway error" });
    }
    res.status(500).json({ success: false, error: "Failed to create booking." });
  } finally {
    client.release();
  }
});


/**
 * GET /
 * Gets all bookings for the currently logged-in user.
 */
router.get("/", authenticateToken, async (req, res) => {
  const { userId } = req.user;
  try {
    const result = await pool.query(
      'SELECT * FROM "bookings" WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Error fetching user bookings:", err.stack);
    res.status(500).json({ success: false, error: "Failed to fetch bookings." });
  }
});

/**
 * GET /:id
 * Gets a single, specific booking, including its items and deliveries.
 */
router.get("/:id", authenticateToken, async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  
  try {
    // 1. Get the master booking
    const bookingResult = await pool.query(
      'SELECT * FROM "bookings" WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Booking not found." });
    }
    const booking = bookingResult.rows[0];

    // 2. Get the items for that booking
    const itemsResult = await pool.query(
      `SELECT bi.*, p.name as product_name, p.image_url 
       FROM "booking_items" bi
       JOIN "products" p ON bi.product_id = p.id
       WHERE bi.booking_id = $1`,
      [id]
    );
    booking.items = itemsResult.rows;

    // 3. Get the deliveries for that booking
    const deliveriesResult = await pool.query(
      `SELECT d.* FROM "deliveries" d
       JOIN "booking_items" bi ON d.booking_item_id = bi.id
       WHERE bi.booking_id = $1
       ORDER BY d.delivery_date ASC`,
      [id]
    );
    booking.deliveries = deliveriesResult.rows;

    res.status(200).json({ success: true, data: booking });

  } catch (err) {
    console.error("Error fetching booking details:", err.stack);
    res.status(500).json({ success: false, error: "Failed to fetch booking details." });
  }
});


// This helper function is used by the COD route.
// The webhook will have its own version.
async function createDeliveriesForBooking(client, bookingId) {
  try {
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
    const addressSnapshot = JSON.stringify(addressResult.rows[0]); // Store as JSONB

    for (const item of bookingItems) {
      // 3. Get the product details for this item
      const productResult = await client.query(
        'SELECT * FROM "products" WHERE id = $1',
        [item.product_id]
      );
      const product = productResult.rows[0];

      // 4. Get the delivery slot (this is simplified; cart item would have this)
      // For now, we'll default 'one-time' to 'asap' and 'subscription' to 'lunch'
      // TODO: Get this value from the cart item in the future
      let slot = 'asap';
      let meal_type = null;
      if (product.booking_type === 'subscription') {
          slot = 'lunch'; // Default to lunch
          meal_type = 'lunch';
      }

      if (product.booking_type === 'one-time') {
        // Create 1 delivery for each quantity
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

        let deliveryDate = new Date(); // TODO: Get this from cart/user
        
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
    console.log(`Deliveries created for COD booking ${bookingId}`);
  } catch (err) {
    console.error(`Error creating deliveries for booking ${bookingId}:`, err.stack);
    // This runs in the background, so we just log the error
  }
}

module.exports = router;