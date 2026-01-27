// backend/routes/bookings.js 

const express = require("express");
const pool = require("../db/db");
const authMiddleware = require("../middlewares/auth");
const authenticateToken = authMiddleware.authenticateToken;
const { Cashfree } = require("cashfree-pg");
const redisClient = require("../lib/redis");
const { z } = require("zod"); 
const router = express.Router();

// Import rate limiter - path is correct
const { bookingLimiter } = require("../middlewares/rateLimiter");

// --- 1. Zod Validation Schemas ---
const cartItemSchema = z.object({
  id: z.any(), 
  name: z.any(),
  quantity: z.any().transform(v => parseInt(v) || 1),
  totalPrice: z.any().transform(v => typeof v === 'string' ? parseFloat(v.replace(/[^\d.-]/g, '')) : v),
  mealType: z.any().optional(),
  startDate: z.any().optional(),
  plan: z.any().optional(),
  base_price: z.any().optional()
});

const bookingSchema = z.object({
  cart: z.object({
    lunch: z.array(cartItemSchema).optional().default([]),
    dinner: z.array(cartItemSchema).optional().default([])
  }),
  cartTotal: z.any().transform(v => typeof v === 'string' ? parseFloat(v.replace(/[^\d.-]/g, '')) : v),
  addressId: z.any(),
  paymentMethod: z.enum(['cod', 'online'])
});

// Cashfree Initialization
let cfConfig = {
    env: process.env.CASHFREE_ENV || 'SANDBOX',
    appId: process.env.CASHFREE_CLIENT_ID,
    secretKey: process.env.CASHFREE_SECRET_KEY,
};
const cashfree = new Cashfree(cfConfig);

/**
 * POST /api/bookings/create
 * Hardened for high-concurrency (10 PM2 instances)
 */
router.post("/create", authenticateToken, bookingLimiter, async (req, res, next) => {
  const validation = bookingSchema.safeParse(req.body);
  
  if (!validation.success) {
    const error = new Error("Invalid booking data");
    error.statusCode = 400;
    error.details = validation.error.errors;
    return next(error); 
  }

  const { cart, cartTotal, addressId, paymentMethod } = validation.data;
  const { userId, name, email, phone } = req.user;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Master Booking
    const bookingQuery = `
      INSERT INTO "bookings" (user_id, address_id, total_amount, payment_method, payment_status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING id
    `;
    const bookingResult = await client.query(bookingQuery, [userId, addressId, cartTotal, paymentMethod]);
    const bookingId = bookingResult.rows[0].id;

    const allItems = [
      ...cart.lunch.map(item => ({ ...item, mealType: 'lunch' })),
      ...cart.dinner.map(item => ({ ...item, mealType: 'dinner' })),
    ];
    
    if (allItems.length === 0) {
      const error = new Error("Cart is empty.");
      error.statusCode = 400;
      throw error;
    }

    for (const item of allItems) {
      const itemQuery = `
        INSERT INTO "booking_items"
          (booking_id, product_id, quantity, subscription_plan_id, price_per_unit, total_price)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
      `;
      const pricePerUnit = item.plan ? item.plan.price : (item.base_price || 0);
      const planId = item.plan ? item.plan.id : null;

      const itemResult = await client.query(itemQuery, [
          bookingId, item.id, item.quantity, planId, pricePerUnit, item.totalPrice
      ]);
      item.booking_item_id = itemResult.rows[0].id;
    }

    // COD Flow
    if (paymentMethod === 'cod') {
      await client.query("UPDATE bookings SET payment_status = 'completed' WHERE id = $1", [bookingId]);
      await client.query("COMMIT");

      // Shared Cache Busting for all 10 instances
      await redisClient.del(`user:${userId}:subscriptions`);
      await redisClient.del(`user:${userId}:next-delivery`);

      // Delivery creation in background to keep response snappy
      setImmediate(() => {
        createDeliveriesForBooking(pool, bookingId, allItems)
          .catch(err => console.error(`[BG-ERR] Booking ${bookingId}:`, err));
      });

      return res.status(201).json({ success: true, message: "Booking placed!", bookingId });

    // Online Flow
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
          throw new Error("Cashfree session initialization failed.");
      }

      await client.query("COMMIT");

      // Clear cache so dashboard is ready post-payment
      await redisClient.del(`user:${userId}:subscriptions`);
      await redisClient.del(`user:${userId}:next-delivery`);

      return res.status(201).json({
        success: true,
        bookingId,
        payment_session_id: cashfreeResponse.data.payment_session_id
      });
    }

  } catch (err) {
    await client.query("ROLLBACK");
    next(err); 
  } finally {
    client.release();
  }
});

/**
 * Shared logic to turn items into deliveries
 */
async function createDeliveriesForBooking(dbPool, bookingId, bookingItems) {
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
        let deliveryDate = item.startDate ? new Date(item.startDate + 'T00:00:00') : new Date();
        
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
  } catch (err) {
    console.error(`[BG-PROCESS] 🚨 Error in delivery creation:`, err.stack);
  }
}

module.exports = router;