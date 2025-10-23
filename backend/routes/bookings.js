const express = require("express");
const pool = require("../db/db");
const { authenticateToken } = require("../middlewares/auth");
const { Cashfree } = require("cashfree-pg"); // Make sure this matches your installed package structure

const router = express.Router();

// --- Cashfree Initialization ---
// Ensure you have CASHFREE_ENV, CASHFREE_CLIENT_ID, CASHFREE_SECRET_KEY in your .env
let cfConfig = {
    env: process.env.CASHFREE_ENV || 'SANDBOX', // 'SANDBOX' or 'PROD'
    appId: process.env.CASHFREE_CLIENT_ID,
    secretKey: process.env.CASHFREE_SECRET_KEY,
};
const cashfree = new Cashfree(cfConfig);


/**
 * POST /create
 * Creates a new booking, handles payment initiation (COD or Online).
 */
router.post("/create", authenticateToken, async (req, res) => {
  const { cart, cartTotal, addressId, paymentMethod } = req.body;
  const { userId, name, email, phone } = req.user; // User details from validated token

  // --- 1. Basic Validation ---
  if (!cart || (!cart.lunch && !cart.dinner) || !cartTotal || !addressId || !paymentMethod) {
    return res.status(400).json({ success: false, error: "Missing required booking data." });
  }
  // Cashfree requires a minimum amount (usually >= 1). Check if online payment.
   if (isNaN(parseFloat(cartTotal)) || (paymentMethod === 'online' && parseFloat(cartTotal) < 1)) {
     return res.status(400).json({ success: false, error: "Invalid cart total amount." });
   }

  const client = await pool.connect();
  let bookingId; // To store the ID of the created booking record

  try {
    await client.query("BEGIN"); // Start database transaction

    // --- 2. Create the Master Booking Record ---
    const bookingQuery = `
      INSERT INTO "bookings" (user_id, address_id, total_amount, payment_method, payment_status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING id
    `;
    const bookingResult = await client.query(bookingQuery, [userId, addressId, cartTotal, paymentMethod]);
    bookingId = bookingResult.rows[0].id;

    // --- 3. Prepare and Insert Booking Items ---
    // Combine lunch and dinner items, adding mealType for delivery creation later
    const allItems = [
      ...(cart.lunch || []).map(item => ({ ...item, mealType: 'lunch' })),
      ...(cart.dinner || []).map(item => ({ ...item, mealType: 'dinner' })),
    ];
    if (allItems.length === 0) {
        throw new Error("Cart is empty, cannot create booking items.");
    }

    // Insert each item into booking_items table
    for (const item of allItems) {
      const itemQuery = `
        INSERT INTO "booking_items"
          (booking_id, product_id, quantity, subscription_plan_id, price_per_unit, total_price)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
      `;
      // Determine price_per_unit based on plan or base product price
      const pricePerUnit = item.plan ? item.plan.price : (item.base_price || 0);
      const planId = item.plan ? item.plan.id : null;
      const totalPriceForItem = item.totalPrice; // This comes from the cart object

      // Validate totalPrice for the item
      if (totalPriceForItem === undefined || totalPriceForItem === null || isNaN(parseFloat(totalPriceForItem))) {
          throw new Error(`Invalid total price for item ${item.name || item.id}.`);
      }

      // Execute insert and get the new booking_item_id
      const itemResult = await client.query(itemQuery, [
          bookingId,
          item.id, // Use item.id (the product's UUID from the cart object)
          item.quantity,
          planId,
          pricePerUnit,
          totalPriceForItem
      ]);
      // Add the database ID back to the item object for delivery creation
      item.booking_item_id = itemResult.rows[0].id;
    }

    // --- 4. Handle Payment Method ---
    if (paymentMethod === 'cod') {
      // For COD, create deliveries right away
      await createDeliveriesForBooking(client, bookingId, allItems); // Pass allItems
      // Mark COD bookings as 'completed' immediately in terms of payment status
      await client.query("UPDATE bookings SET payment_status = 'completed' WHERE id = $1", [bookingId]);
      await client.query("COMMIT"); // Commit transaction

      res.status(201).json({
        success: true,
        message: "Booking placed successfully!",
        bookingId: bookingId,
        payment_session_id: null // No payment session for COD
      });

    } else if (paymentMethod === 'online') {
      // For Online Payment, initiate Cashfree order
      const cashfreeOrderId = `BOOKING_${bookingId}_${Date.now()}`; // Add timestamp for uniqueness
      // Update our booking record with Cashfree's order ID
      await client.query('UPDATE "bookings" SET cashfree_order_id = $1 WHERE id = $2', [cashfreeOrderId, bookingId]);

      // Prepare request for Cashfree API
      const request = {
        order_amount: parseFloat(cartTotal), // Ensure it's a number
        order_currency: "INR",
        order_id: cashfreeOrderId,
        customer_details: {
          customer_id: userId.toString(), // Ensure IDs are strings if required by Cashfree
          customer_name: name || "Guest", // Add fallback
          customer_email: email,
          customer_phone: phone
        },
        order_meta: {
          // Use your frontend URL for redirection after payment
          return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/order-success?booking_id=${bookingId}`
          // notify_url: `${process.env.BACKEND_URL}/api/payment/webhook` // Add webhook URL if configured
        },
        // order_note: "HomelyKhana Meal Order" // Optional note
      };

      // Call Cashfree API - adjust based on your library version
      let cashfreeResponse;
      // Check for the specific method used by your version of the SDK
      if (cashfree.orders && typeof cashfree.orders.createOrder === 'function') {
         cashfreeResponse = await cashfree.orders.createOrder(request);
      } else if (typeof cashfree.PGCreateOrder === 'function') {
         // Example for an older/different version structure - CHECK YOUR SDK DOCS
         cashfreeResponse = await cashfree.PGCreateOrder("2023-08-01", request); // API version might be required
      } else {
         console.error("Cashfree SDK method ('orders.createOrder' or 'PGCreateOrder') not found.");
         throw new Error("Cashfree SDK method not found. Check library version/initialization.");
      }

      // Validate the response from Cashfree
      if (!cashfreeResponse?.data?.payment_session_id) {
          console.error("Invalid Cashfree response:", cashfreeResponse);
          throw new Error("Failed to get payment session ID from Cashfree.");
      }
      const payment_session_id = cashfreeResponse.data.payment_session_id;

      // Important: Commit transaction ONLY after successfully getting payment session ID
      await client.query("COMMIT");

      res.status(201).json({
        success: true,
        message: "Booking created, redirecting to payment.",
        bookingId: bookingId,
        payment_session_id: payment_session_id // Send this ID to frontend SDK
      });
    }

  } catch (err) {
    await client.query("ROLLBACK"); // Rollback transaction on any error
    // Log detailed error information
    console.error(`Error during booking creation for user ${userId}:`, err.message);
    if (bookingId) {
        console.error(` -> Transaction failed for booking ID attempt: ${bookingId}`);
    }
    console.error("Full Error Stack:", err.stack); // Log the full stack trace

    // Specific error handling (e.g., Cashfree API error)
    if (err.response && err.response.data) { // Check if it's likely a Cashfree error
      console.error("Cashfree API Error:", err.response.data);
      return res.status(500).json({ success: false, error: err.response.data.message || "Payment gateway error" });
    }
    // Generic error response
    res.status(500).json({ success: false, error: "Failed to create booking." });
  } finally {
    client.release(); // Release the client back to the pool
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
 * Gets details for a specific booking owned by the user, including items and deliveries.
 */
router.get("/:id", authenticateToken, async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params; // Booking ID from URL parameter

  try {
    // 1. Get the main booking record, ensuring it belongs to the user
    const bookingResult = await pool.query(
      'SELECT * FROM "bookings" WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Booking not found or access denied." });
    }
    const booking = bookingResult.rows[0];

    // 2. Get the associated items with product details
    const itemsResult = await pool.query(
      `SELECT bi.*, p.name as product_name, p.image_url
       FROM "booking_items" bi
       JOIN "products" p ON bi.product_id = p.id
       WHERE bi.booking_id = $1`,
      [id]
    );
    booking.items = itemsResult.rows;

    // 3. Get all associated deliveries
    const deliveriesResult = await pool.query(
      `SELECT d.* FROM "deliveries" d
       JOIN "booking_items" bi ON d.booking_item_id = bi.id
       WHERE bi.booking_id = $1
       ORDER BY d.delivery_date ASC, d.delivery_slot ASC`, // Added slot sorting
      [id]
    );
    booking.deliveries = deliveriesResult.rows;

    res.status(200).json({ success: true, data: booking });

  } catch (err) {
    console.error("Error fetching booking details:", err.stack);
    res.status(500).json({ success: false, error: "Failed to fetch booking details." });
  }
});


/**
 * Helper function to create delivery records for a booking.
 * This version includes detailed logging and the fix for checking item.plan.id.
 */
async function createDeliveriesForBooking(client, bookingId, bookingItems) {
  console.log(`\n--- [DEBUG] Starting delivery creation for Booking ID: ${bookingId} ---`);
  if (!bookingItems || bookingItems.length === 0) {
      console.log("[DEBUG] No items provided. Aborting delivery creation.");
      return;
  }
  console.log(`[DEBUG] Received ${bookingItems.length} item(s) to process.`);
  // Limit logging potentially large objects in production if needed
  // console.log("[DEBUG] Item data received:", JSON.stringify(bookingItems, null, 2));

  try {
    // Get the address snapshot associated with this booking
    const addressResult = await client.query(`SELECT a.* FROM "addresses" a JOIN "bookings" b ON a.id = b.address_id WHERE b.id = $1`, [bookingId]);
    if (addressResult.rows.length === 0) {
        throw new Error(`Address not found for booking ${bookingId}.`);
    }
    const addressSnapshot = JSON.stringify(addressResult.rows[0]); // Store address details as JSONB
    console.log(`[DEBUG] Found address snapshot for address ID: ${addressResult.rows[0].id}`);

    for (const item of bookingItems) {
      console.log(`\n[DEBUG] Processing item with product ID: ${item.id} and booking_item_id: ${item.booking_item_id}`);
      
      // Get product details (specifically booking_type)
      const productResult = await client.query('SELECT booking_type FROM "products" WHERE id = $1', [item.id]);
      if (productResult.rows.length === 0) {
          console.log(`[DEBUG] ❌ Product with ID ${item.id} NOT FOUND. Skipping this item.`);
          continue; // Skip to the next item
      }
      const product = productResult.rows[0];
      console.log(`[DEBUG] Found product. Type: ${product.booking_type}`);

      // Determine delivery slot and meal type based on item details
      const slot = item.mealType === 'dinner' ? 'dinner' : 'lunch';
      const meal_type = item.mealType;
      console.log(`[DEBUG] Determined slot: '${slot}', meal_type: '${meal_type}'`);

      // Check if it's a subscription item and has plan details
      if (product.booking_type === 'subscription' && item.plan && item.plan.id) {
        const planIdToFetch = item.plan.id; // Use the ID from the nested plan object
        console.log(`[DEBUG] Item is a subscription. Looking for plan ID: ${planIdToFetch}`);
        
        const planResult = await client.query('SELECT duration_days FROM "subscription_plans" WHERE id = $1', [planIdToFetch]);
        if (planResult.rows.length === 0) {
            console.log(`[DEBUG] ❌ Plan with ID ${planIdToFetch} NOT FOUND. Skipping this item.`);
            continue; // Skip to the next item if plan details are missing
        }
        const plan = planResult.rows[0];
        console.log(`[DEBUG] Found plan. Duration: ${plan.duration_days} days.`);

        // Determine the starting date for deliveries
        let deliveryDate;
        try {
            const parsedDate = new Date(item.startDate + 'T00:00:00'); // Assume YYYY-MM-DD input, force UTC midnight
            if (isNaN(parsedDate.getTime())) { // Check if the parsed date is valid
                throw new Error("Invalid date format");
            }
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Normalize today to midnight UTC for comparison

            // If start date is in the past, set delivery to start tomorrow
            if (parsedDate < today) {
                console.log(`[DEBUG] Start date ${item.startDate} is in the past. Defaulting to tomorrow.`);
                deliveryDate = new Date(); // Get current date
                deliveryDate.setDate(deliveryDate.getDate() + 1); // Set to tomorrow
                deliveryDate.setHours(0,0,0,0); // Normalize to midnight
            } else {
                deliveryDate = parsedDate; // Use the valid, future start date
            }
        } catch (e) {
             // Fallback if date parsing fails or any other error occurs
             console.log(`[DEBUG] Error parsing start date "${item.startDate}", defaulting to tomorrow. Error: ${e.message}`);
             deliveryDate = new Date(); // Get current date
             deliveryDate.setDate(deliveryDate.getDate() + 1); // Set to tomorrow
             deliveryDate.setHours(0,0,0,0); // Normalize to midnight
        }
        console.log(`[DEBUG] Calculated start date for deliveries: ${deliveryDate.toISOString().split('T')[0]}`);

        let createdDeliveries = 0;
        let loopGuard = 0; // Safety measure against infinite loops
        const planDuration = plan.duration_days || 0; // Ensure duration is a number
        const maxDaysToCheck = planDuration * 3 + 7; // Look ahead generously (e.g., allows for weekly plans spanning months)

        // Loop to create deliveries based on plan duration
        while (createdDeliveries < planDuration && loopGuard < maxDaysToCheck) {
            // --- TODO: Implement Frequency Check Logic Here ---
            // This is where you'd check `item.frequency` (e.g., "Mon - Fri", "Mon, Wed, Fri")
            // against the `deliveryDate.getDay()` (0=Sun, 1=Mon, ..., 6=Sat)
            // Example Placeholder:
            // const dayOfWeek = deliveryDate.getDay();
            // if (shouldDeliverBasedOnFrequency(dayOfWeek, item.frequency)) {
                // If the frequency matches, insert the delivery record
                console.log(`[DEBUG] -> Inserting delivery #${createdDeliveries + 1} for date: ${deliveryDate.toISOString().split('T')[0]}`);
                await client.query(
                  `INSERT INTO "deliveries" (booking_item_id, delivery_date, delivery_slot, status, delivery_address, meal_type) VALUES ($1, $2, $3, 'scheduled', $4, $5)`,
                  [item.booking_item_id, deliveryDate.toISOString().split('T')[0], slot, addressSnapshot, meal_type]
                );
                createdDeliveries++; // Increment only when a delivery is actually created
            // } else {
            //    console.log(`[DEBUG] -> Skipping delivery for date: ${deliveryDate.toISOString().split('T')[0]} due to frequency rules.`);
            // }
            
            // Always increment the date for the next day check
            deliveryDate.setDate(deliveryDate.getDate() + 1);
            loopGuard++;
        }

        if (createdDeliveries < planDuration) {
             console.warn(`[DEBUG] Loop finished. Created ${createdDeliveries} out of expected ${planDuration} deliveries for item ${item.booking_item_id}. Loop guard: ${loopGuard}`);
        } else {
            console.log(`[DEBUG] Finished loop. Created ${createdDeliveries} deliveries for this item.`);
        }

      } else {
        // Log why the loop was skipped (not subscription or missing plan details)
        if (product.booking_type !== 'subscription') {
             console.log("[DEBUG] Item is not a subscription type. Skipping subscription delivery loop.");
             // Add logic here if you support one-time deliveries
        } else if (!item.plan || !item.plan.id) {
             console.log("[DEBUG] Item is missing plan details (item.plan or item.plan.id). Skipping subscription delivery loop.");
        } else {
             console.log("[DEBUG] Skipping subscription delivery loop for unknown reason for item.");
        }
      }
    } // End loop through items

    console.log(`\n--- [DEBUG] ✅ Finished delivery creation attempt for Booking ID: ${bookingId} ---`);
  } catch (err) {
    // Log error but allow main transaction to potentially commit if this is non-critical
    // Re-throwing would cause the entire booking to fail if delivery creation fails
    console.error(`🚨 [DEBUG] Error within createDeliveriesForBooking for booking ${bookingId}:`, err.stack);
    // Depending on business logic, you might want to re-throw `throw err;`
    // to ensure the booking transaction rolls back if deliveries cannot be created.
  }
}

module.exports = router;