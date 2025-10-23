const express = require('express');
const router = express.Router();
const pool = require('../db/db'); // Import your database pool
// Import only the admin authenticator
const { authenticateAdmin } = require('../middlewares/auth');

/**
 * [GET /api/admin/stats]
 * A secure endpoint to get all stats for the admin dashboard KPIs.
 * Protected by the authenticateAdmin middleware.
 */
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    // Run all KPI queries in parallel for efficiency
    const [salesResult, ordersResult, subsResult, lunchResult, dinnerResult] = await Promise.all([
      // 1. Total Sales (This Month, Completed Payments Only)
      pool.query(
        `SELECT SUM(total_amount) as totalSales FROM bookings
         WHERE payment_status = 'completed' AND created_at >= DATE_TRUNC('month', CURRENT_DATE);`
      ),

      // 2. New Orders (This Month, regardless of payment status)
      pool.query(
        `SELECT COUNT(id) as newOrders FROM bookings
         WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE);`
      ),

      // 3. Active Subscriptions
      // (Counts distinct bookings that have at least one delivery scheduled for today or the future)
      pool.query(
        `SELECT COUNT(DISTINCT bi.booking_id) as activeSubscriptions
         FROM booking_items bi
         JOIN deliveries d ON bi.id = d.booking_item_id
         WHERE bi.subscription_plan_id IS NOT NULL
           AND d.delivery_date >= CURRENT_DATE
           AND d.status = 'scheduled';`
      ),

      // 4. Meals Scheduled Today (Lunch)
      pool.query(
        `SELECT COUNT(id) as mealsTodayLunch FROM deliveries
         WHERE delivery_date = CURRENT_DATE
           AND delivery_slot = 'lunch'
           AND status = 'scheduled';`
      ),

      // 5. Meals Scheduled Today (Dinner)
      pool.query(
        `SELECT COUNT(id) as mealsTodayDinner FROM deliveries
         WHERE delivery_date = CURRENT_DATE
           AND delivery_slot = 'dinner'
           AND status = 'scheduled';`
      )
    ]);

    // Format results, handling potential nulls if no data exists
    const stats = {
      totalSales: parseFloat(salesResult.rows[0].totalsales || 0),
      newOrders: parseInt(ordersResult.rows[0].neworders || 0),
      activeSubscriptions: parseInt(subsResult.rows[0].activesubscriptions || 0),
      mealsTodayLunch: parseInt(lunchResult.rows[0].mealstodaylunch || 0),
      mealsTodayDinner: parseInt(dinnerResult.rows[0].mealstodaydinner || 0)
    };

    res.json({ success: true, data: stats });

  } catch (err) {
    console.error("Error fetching admin stats:", err.message);
    res.status(500).json({ success: false, error: "Server error fetching dashboard stats" });
  }
});

/**
 * [GET /api/admin/bookings]
 * Securely fetches bookings with filtering, searching, and pagination.
 * Includes basic user details.
 * Protected by authenticateAdmin middleware.
 */
router.get('/bookings', authenticateAdmin, async (req, res) => {
    // --- Pagination ---
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10); // Default 10 per page
    const offset = (page - 1) * limit;

    // --- Filters ---
    const status = req.query.status; // e.g., 'completed', 'pending'
    const method = req.query.method; // e.g., 'cod', 'online'
    const startDate = req.query.startDate; // e.g., '2025-10-01'
    const endDate = req.query.endDate; // e.g., '2025-10-22'

    // --- Search ---
    const searchQuery = req.query.search; // Search term for name/email

    // --- Build Query ---
    let baseQuery = `
        SELECT
            b.id, b.created_at, b.total_amount, b.payment_method, b.payment_status,
            u.name as customer_name, u.email as customer_email
        FROM bookings b
        JOIN users u ON b.user_id = u.id
    `;
    let countQuery = `
        SELECT COUNT(b.id)
        FROM bookings b
        JOIN users u ON b.user_id = u.id
    `;
    let conditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // Apply Filters
    if (status) {
        conditions.push(`b.payment_status = $${paramIndex++}`);
        queryParams.push(status);
    }
    if (method) {
        conditions.push(`b.payment_method = $${paramIndex++}`);
        queryParams.push(method);
    }
    if (startDate) {
        conditions.push(`b.created_at >= $${paramIndex++}`);
        queryParams.push(startDate); // Assumes YYYY-MM-DD format
    }
    if (endDate) {
        // Add 1 day to endDate to include the whole day
        const nextDay = new Date(endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        conditions.push(`b.created_at < $${paramIndex++}`);
        queryParams.push(nextDay.toISOString().split('T')[0]);
    }

    // Apply Search (simple case-insensitive search on name/email)
    if (searchQuery) {
        conditions.push(`(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
        queryParams.push(`%${searchQuery}%`); // Add wildcards
        paramIndex++;
    }

    // Combine conditions
    if (conditions.length > 0) {
        const whereClause = ` WHERE ${conditions.join(' AND ')}`;
        baseQuery += whereClause;
        countQuery += whereClause;
    }

    // Add Ordering and Pagination to base query
    baseQuery += ` ORDER BY b.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(limit, offset);

    try {
        // Execute both queries (data + total count)
        const bookingsResult = await pool.query(baseQuery, queryParams);
        const totalResult = await pool.query(countQuery, queryParams.slice(0, paramIndex - 3)); // Exclude limit/offset params

        const totalBookings = parseInt(totalResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalBookings / limit);

        res.json({
            success: true,
            data: bookingsResult.rows,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalBookings,
                itemsPerPage: limit
            }
        });

    } catch (err) {
        console.error("Error fetching filtered/paginated bookings for admin:", err.message);
        res.status(500).json({ success: false, error: "Server error fetching bookings" });
    }
});

/**
 * [GET /api/admin/kitchen-prep]
 * Securely fetches aggregated meal quantities needed for a specific date.
 * Protected by authenticateAdmin middleware.
 * Expects a 'date' query parameter (YYYY-MM-DD), defaults to tomorrow.
 */
router.get('/kitchen-prep', authenticateAdmin, async (req, res) => {
    try {
        // Determine the target date
        let targetDate;
        if (req.query.date) {
            // Validate the incoming date format if needed
            targetDate = req.query.date;
        } else {
            // Default to tomorrow's date
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            targetDate = tomorrow.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        }

        // Query to get total quantity for each product and meal type for the target date
        const query = `
            SELECT
                p.name as product_name,       -- Name of the meal
                d.meal_type,                  -- 'lunch' or 'dinner'
                SUM(bi.quantity) as total_quantity -- Sum the quantity from booking_items
            FROM
                deliveries d
            JOIN
                booking_items bi ON d.booking_item_id = bi.id
            JOIN
                products p ON bi.product_id = p.id
            WHERE
                d.delivery_date = $1          -- Filter by the target date
                AND d.status = 'scheduled'    -- Only include scheduled deliveries
            GROUP BY
                p.name, d.meal_type           -- Group by meal and type
            ORDER BY
                d.meal_type, p.name;          -- Sort for consistent display
        `;

        const result = await pool.query(query, [targetDate]);

        // Structure the data for the frontend (grouped by meal_type)
        const prepData = {
            date: targetDate,
            lunch: result.rows.filter(row => row.meal_type === 'lunch'),
            dinner: result.rows.filter(row => row.meal_type === 'dinner')
        };

        res.json({ success: true, data: prepData });

    } catch (err) {
        console.error(`Error fetching kitchen prep data for date ${req.query.date}:`, err.message);
        res.status(500).json({ success: false, error: "Server error fetching kitchen prep data" });
    }
});

/**
 * [GET /api/admin/dispatch-sheet]
 * Securely fetches detailed delivery list for a specific date and slot.
 * Protected by authenticateAdmin middleware.
 * Expects 'date' (YYYY-MM-DD) query param (defaults to today).
 * Optional 'slot' query param ('lunch', 'dinner').
 */
router.get('/dispatch-sheet', authenticateAdmin, async (req, res) => {
    try {
        // --- Determine Target Date ---
        let targetDate;
        if (req.query.date) {
            targetDate = req.query.date; // Basic validation could be added
        } else {
            // Default to today's date
            targetDate = new Date().toISOString().split('T')[0];
        }

        // --- Determine Slot Filter ---
        const slotFilter = req.query.slot; // 'lunch' or 'dinner'
        let slotCondition = "";
        const queryParams = [targetDate];
        if (slotFilter === 'lunch' || slotFilter === 'dinner') {
            slotCondition = ` AND d.delivery_slot = $2`;
            queryParams.push(slotFilter);
        }

        // --- Build the Query ---
        // Joins deliveries -> booking_items -> products -> bookings -> users -> addresses
        const query = `
            SELECT
                d.id as delivery_id,
                d.delivery_date,
                d.delivery_slot,
                d.status,
                d.meal_type,
                bi.quantity,                    -- Quantity from booking_items
                p.name as product_name,         -- Meal name from products
                u.name as customer_name,
                a.phone as customer_phone,      -- Phone from the delivery address snapshot
                a.full_name as delivery_name,   -- Name from the delivery address snapshot
                a.address_line_1,
                a.address_line_2,
                a.city,
                a.state,
                a.pincode,
                a.landmark,
                a.type as address_type,
                b.notes as booking_notes        -- Notes from the main booking
            FROM
                deliveries d
            JOIN
                booking_items bi ON d.booking_item_id = bi.id
            JOIN
                products p ON bi.product_id = p.id
            JOIN
                bookings b ON bi.booking_id = b.id
            JOIN
                users u ON b.user_id = u.id
            -- The delivery_address column stores a JSON snapshot of the address
            -- We need to use JSON operators to extract fields
            JOIN LATERAL jsonb_to_record(d.delivery_address) as a(
                id UUID, type TEXT, is_default BOOLEAN, full_name TEXT, phone TEXT,
                address_line_1 TEXT, address_line_2 TEXT, city TEXT, state TEXT,
                pincode TEXT, landmark TEXT
            ) ON true -- Joins each delivery to its address snapshot details
            WHERE
                d.delivery_date = $1
                AND d.status = 'scheduled' -- Initially show only scheduled ones, can be changed later
                ${slotCondition}          -- Add slot condition if provided
            ORDER BY
                d.delivery_slot, a.pincode, customer_name; -- Sort by slot, then pincode, then name
        `;

        const result = await pool.query(query, queryParams);

        res.json({ success: true, data: result.rows, date: targetDate, slot: slotFilter || 'all' });

    } catch (err) {
        console.error(`Error fetching dispatch sheet for date ${req.query.date}, slot ${req.query.slot}:`, err.message);
        console.error(err.stack); // Log full stack for detailed errors
        res.status(500).json({ success: false, error: "Server error fetching dispatch data" });
    }
});

/**
 * [GET /api/admin/products]
 * Securely fetches all products (including inactive ones) for the admin portal.
 * Protected by authenticateAdmin middleware.
 */
router.get('/products', authenticateAdmin, async (req, res) => {
    try {
        // Fetch all products, optionally joining with product_types if needed
        // Ordering by creation date or name might be useful
        const query = `
            SELECT
                p.id,
                p.name,
                p.description,
                p.image_url,
                p.base_price,
                p.booking_type,
                p.is_active,
                p.created_at,
                pt.name as product_type_name -- Get the type name
            FROM
                products p
            LEFT JOIN
                product_types pt ON p.product_type_id = pt.id
            ORDER BY
                p.created_at DESC;
        `;
        const result = await pool.query(query);

        res.json({ success: true, data: result.rows });

    } catch (err) {
        console.error("Error fetching products for admin:", err.message);
        res.status(500).json({ success: false, error: "Server error fetching products" });
    }
});

// Add this inside backend/routes/admin.js

/**
 * [POST /api/admin/products]
 * Securely creates a new product.
 * Protected by authenticateAdmin middleware.
 */
router.post('/products', authenticateAdmin, async (req, res) => {
    // --- 1. Extract and Validate Data ---
    const {
        name,
        description,
        imageUrl, // Changed from image_url for consistency
        basePrice, // Changed from base_price
        bookingType, // Changed from booking_type
        productTypeId, // Changed from product_type_id
        isActive // Changed from is_active
    } = req.body;

    // Basic validation
    if (!name || !bookingType || !productTypeId) {
        return res.status(400).json({ success: false, error: 'Product name, booking type, and product type ID are required.' });
    }
    // Validate basePrice (must be non-negative number)
    if (basePrice === undefined || basePrice === null || isNaN(parseFloat(basePrice)) || parseFloat(basePrice) < 0) {
        return res.status(400).json({ success: false, error: 'Valid base price (0 or greater) is required.' });
    }
     // Validate bookingType enum
    if (!['one-time', 'subscription', 'both'].includes(bookingType)) {
        return res.status(400).json({ success: false, error: 'Invalid booking type specified.' });
    }
     // Validate isActive is a boolean
    if (typeof isActive !== 'boolean') {
        return res.status(400).json({ success: false, error: 'isActive must be true or false.' });
    }
     // Validate productTypeId (should be a positive integer) - rudimentary check
     if (isNaN(parseInt(productTypeId)) || parseInt(productTypeId) <= 0) {
         return res.status(400).json({ success: false, error: 'Invalid product type ID.' });
     }


    // --- 2. Insert into Database ---
    try {
        const query = `
            INSERT INTO products (
                name, description, image_url, base_price, booking_type, product_type_id, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *; -- Return the newly created product
        `;
        const result = await pool.query(query, [
            name,
            description || null, // Allow null description
            imageUrl || null,    // Allow null image URL
            parseFloat(basePrice),
            bookingType,
            parseInt(productTypeId),
            isActive
        ]);

        res.status(201).json({ success: true, data: result.rows[0], message: 'Product created successfully.' });

    } catch (err) {
        console.error("Error creating product:", err.message);
        // Handle potential foreign key error if productTypeId doesn't exist
        if (err.code === '23503') { // Foreign key violation
             return res.status(400).json({ success: false, error: 'Invalid Product Type specified.' });
        }
        res.status(500).json({ success: false, error: "Server error creating product." });
    }
});


/**
 * [GET /api/admin/product-types]
 * Securely fetches all available product types for dropdowns.
 * Protected by authenticateAdmin middleware.
 */
router.get('/product-types', authenticateAdmin, async (req, res) => {
    try {
        const query = `SELECT id, name FROM product_types ORDER BY name ASC;`;
        const result = await pool.query(query);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error("Error fetching product types for admin:", err.message);
        res.status(500).json({ success: false, error: "Server error fetching product types." });
    }
});

// Add these inside backend/routes/admin.js

/**
 * [GET /api/admin/products/:id]
 * Securely fetches details for a single product by its ID.
 * Protected by authenticateAdmin middleware.
 */
router.get('/products/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT
                p.id, p.name, p.description, p.image_url, p.base_price,
                p.booking_type, p.product_type_id, p.is_active, pt.name as product_type_name
            FROM products p
            LEFT JOIN product_types pt ON p.product_type_id = pt.id
            WHERE p.id = $1;
        `;
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Product not found.' });
        }

        res.json({ success: true, data: result.rows[0] });

    } catch (err) {
        console.error(`Error fetching product ${id} for admin:`, err.message);
        res.status(500).json({ success: false, error: "Server error fetching product details." });
    }
});

/**
 * [PUT /api/admin/products/:id]
 * Securely updates an existing product.
 * Protected by authenticateAdmin middleware.
 */
router.put('/products/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    // --- 1. Extract and Validate Data (Similar to POST) ---
    const {
        name, description, imageUrl, basePrice, bookingType, productTypeId, isActive
    } = req.body;

    // Basic validation (ensure required fields are present and valid)
    if (!name || !bookingType || !productTypeId) {
        return res.status(400).json({ success: false, error: 'Product name, booking type, and product type ID are required.' });
    }
    if (basePrice === undefined || basePrice === null || isNaN(parseFloat(basePrice)) || parseFloat(basePrice) < 0) {
        return res.status(400).json({ success: false, error: 'Valid base price (0 or greater) is required.' });
    }
    if (!['one-time', 'subscription', 'both'].includes(bookingType)) {
        return res.status(400).json({ success: false, error: 'Invalid booking type specified.' });
    }
    if (typeof isActive !== 'boolean') {
        return res.status(400).json({ success: false, error: 'isActive must be true or false.' });
    }
     if (isNaN(parseInt(productTypeId)) || parseInt(productTypeId) <= 0) {
         return res.status(400).json({ success: false, error: 'Invalid product type ID.' });
     }

    // --- 2. Update in Database ---
    try {
        const query = `
            UPDATE products SET
                name = $1,
                description = $2,
                image_url = $3,
                base_price = $4,
                booking_type = $5,
                product_type_id = $6,
                is_active = $7,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $8
            RETURNING *; -- Return the updated product
        `;
        const result = await pool.query(query, [
            name,
            description || null,
            imageUrl || null,
            parseFloat(basePrice),
            bookingType,
            parseInt(productTypeId),
            isActive,
            id // The product ID from the URL parameter
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Product not found or failed to update.' });
        }

        res.json({ success: true, data: result.rows[0], message: 'Product updated successfully.' });

    } catch (err) {
        console.error(`Error updating product ${id}:`, err.message);
         if (err.code === '23503') { // Foreign key violation
             return res.status(400).json({ success: false, error: 'Invalid Product Type specified.' });
        }
        res.status(500).json({ success: false, error: "Server error updating product." });
    }
});
// Add these inside backend/routes/admin.js

/**
 * [GET /api/admin/products/:productId/plans]
 * Securely fetches all subscription plans for a specific product.
 * Protected by authenticateAdmin middleware.
 */
router.get('/products/:productId/plans', authenticateAdmin, async (req, res) => {
    const { productId } = req.params;
    try {
        const query = `
            SELECT id, plan_name, description, price, duration_days, meals_per_day, is_active, sort_order
            FROM subscription_plans
            WHERE product_id = $1
            ORDER BY sort_order ASC, created_at ASC;
        `;
        const result = await pool.query(query, [productId]);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(`Error fetching plans for product ${productId}:`, err.message);
        res.status(500).json({ success: false, error: "Server error fetching subscription plans." });
    }
});

/**
 * [POST /api/admin/products/:productId/plans]
 * Securely adds a new subscription plan to a specific product.
 * Protected by authenticateAdmin middleware.
 */
router.post('/products/:productId/plans', authenticateAdmin, async (req, res) => {
    const { productId } = req.params;
    const { planName, description, price, durationDays, mealsPerDay = 1, isActive = true, sortOrder = 0 } = req.body;

    // Validation
    if (!planName || !price || !durationDays) {
        return res.status(400).json({ success: false, error: 'Plan Name, Price, and Duration (days) are required.' });
    }
     if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
        return res.status(400).json({ success: false, error: 'Price must be a valid non-negative number.' });
    }
     if (isNaN(parseInt(durationDays)) || parseInt(durationDays) <= 0) {
        return res.status(400).json({ success: false, error: 'Duration must be a positive whole number of days.' });
    }
     if (isNaN(parseInt(mealsPerDay)) || parseInt(mealsPerDay) <= 0) {
        return res.status(400).json({ success: false, error: 'Meals per day must be a positive whole number.' });
    }

    try {
        const query = `
            INSERT INTO subscription_plans
                (product_id, plan_name, description, price, duration_days, meals_per_day, is_active, sort_order)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
        `;
        const result = await pool.query(query, [
            productId,
            planName.trim(),
            description || null,
            parseFloat(price),
            parseInt(durationDays),
            parseInt(mealsPerDay),
            isActive,
            parseInt(sortOrder) || 0
        ]);
        res.status(201).json({ success: true, data: result.rows[0], message: 'Subscription plan added successfully.' });
    } catch (err) {
        console.error(`Error adding plan to product ${productId}:`, err.message);
         // Check if product_id exists
        if (err.code === '23503') {
             return res.status(400).json({ success: false, error: 'Invalid Product ID specified.' });
        }
        res.status(500).json({ success: false, error: "Server error adding subscription plan." });
    }
});

/**
 * [PUT /api/admin/plans/:planId]
 * Securely updates an existing subscription plan.
 * Protected by authenticateAdmin middleware.
 */
router.put('/plans/:planId', authenticateAdmin, async (req, res) => {
    const { planId } = req.params;
    // Extract fields that can be updated
    const { planName, description, price, durationDays, mealsPerDay, isActive, sortOrder } = req.body;

    // Validation (similar to POST, ensure required fields aren't made empty/invalid)
     if (!planName || price === undefined || durationDays === undefined) {
        return res.status(400).json({ success: false, error: 'Plan Name, Price, and Duration cannot be empty.' });
    }
    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
       return res.status(400).json({ success: false, error: 'Invalid Price.' });
    }
    if (isNaN(parseInt(durationDays)) || parseInt(durationDays) <= 0) {
       return res.status(400).json({ success: false, error: 'Invalid Duration.' });
    }
    // Optional fields need checks too if provided
    if (mealsPerDay !== undefined && (isNaN(parseInt(mealsPerDay)) || parseInt(mealsPerDay) <= 0)) {
        return res.status(400).json({ success: false, error: 'Invalid Meals per Day.' });
    }
     if (isActive !== undefined && typeof isActive !== 'boolean') {
        return res.status(400).json({ success: false, error: 'Invalid Active status.' });
    }
     if (sortOrder !== undefined && isNaN(parseInt(sortOrder))) {
        return res.status(400).json({ success: false, error: 'Invalid Sort Order.' });
    }


    try {
        const query = `
            UPDATE subscription_plans SET
                plan_name = $1,
                description = $2,
                price = $3,
                duration_days = $4,
                meals_per_day = $5,
                is_active = $6,
                sort_order = $7
                -- updated_at timestamp is handled by trigger if you added one
            WHERE id = $8
            RETURNING *;
        `;
        const result = await pool.query(query, [
            planName.trim(),
            description || null,
            parseFloat(price),
            parseInt(durationDays),
            // Use current value if not provided in request? Or default? Defaulting to 1.
            (mealsPerDay !== undefined) ? parseInt(mealsPerDay) : 1,
            // Use current value if not provided? Defaulting to true.
            (isActive !== undefined) ? isActive : true,
            (sortOrder !== undefined) ? parseInt(sortOrder) : 0,
            planId
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Subscription plan not found.' });
        }
        res.json({ success: true, data: result.rows[0], message: 'Subscription plan updated successfully.' });
    } catch (err) {
        console.error(`Error updating plan ${planId}:`, err.message);
        res.status(500).json({ success: false, error: "Server error updating subscription plan." });
    }
});

/**
 * [DELETE /api/admin/plans/:planId]
 * Securely deletes a subscription plan.
 * Protected by authenticateAdmin middleware.
 */
router.delete('/plans/:planId', authenticateAdmin, async (req, res) => {
    const { planId } = req.params;
    try {
        // Check if plan is linked to any active bookings/items first? (Optional)
        // For simplicity, we directly delete here. Add checks if needed.
        const query = `DELETE FROM subscription_plans WHERE id = $1 RETURNING *;`;
        const result = await pool.query(query, [planId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Subscription plan not found.' });
        }
        res.json({ success: true, message: 'Subscription plan deleted successfully.' });
    } catch (err) {
        console.error(`Error deleting plan ${planId}:`, err.message);
         // Handle foreign key constraint if plan is in use by booking_items
        if (err.code === '23503') {
            return res.status(400).json({ success: false, error: 'Cannot delete plan: it is currently associated with existing orders.' });
        }
        res.status(500).json({ success: false, error: "Server error deleting subscription plan." });
    }
});

// Add this inside backend/routes/admin.js

/**
 * [GET /api/admin/customers]
 * Securely fetches users (customers) with searching and pagination.
 * Excludes password hash.
 * Protected by authenticateAdmin middleware.
 */
router.get('/customers', authenticateAdmin, async (req, res) => {
    // --- Pagination ---
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '15', 10); // Default 15 per page
    const offset = (page - 1) * limit;

    // --- Search ---
    const searchQuery = req.query.search; // Search term for name/email/phone

    // --- Build Query ---
    // Select specific columns, excluding password_hash
    let baseQuery = `
        SELECT
            id, name, email, phone, role, created_at
        FROM users
    `;
    let countQuery = `SELECT COUNT(id) FROM users`;
    let conditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // Apply Search (case-insensitive search on name, email, phone)
    if (searchQuery) {
        conditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`);
        queryParams.push(`%${searchQuery}%`); // Add wildcards
        paramIndex++;
    }

    // --- Filter out Admin Role (Optional) ---
    // If you only want to see 'customer' role users:
    // conditions.push(`role = $${paramIndex++}`);
    // queryParams.push('customer');
    // --- End Optional Filter ---


    // Combine conditions
    if (conditions.length > 0) {
        const whereClause = ` WHERE ${conditions.join(' AND ')}`;
        baseQuery += whereClause;
        countQuery += whereClause;
    }

    // Add Ordering and Pagination to base query
    baseQuery += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(limit, offset);

    try {
        // Execute both queries
        const usersResult = await pool.query(baseQuery, queryParams);
        // Adjust parameter count for count query
        const totalResult = await pool.query(countQuery, queryParams.slice(0, paramIndex - 3));

        const totalUsers = parseInt(totalResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalUsers / limit);

        res.json({
            success: true,
            data: usersResult.rows,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalUsers,
                itemsPerPage: limit
            }
        });

    } catch (err) {
        console.error("Error fetching customers for admin:", err.message);
        res.status(500).json({ success: false, error: "Server error fetching customers" });
    }
});

// Add these inside backend/routes/admin.js

/**
 * [GET /api/admin/reviews]
 * Securely fetches all reviews (or filter by status).
 * Includes user name and product name.
 * Protected by authenticateAdmin middleware.
 */
router.get('/reviews', authenticateAdmin, async (req, res) => {
    const statusFilter = req.query.status; // Optional filter: 'pending', 'approved'
    let query = `
        SELECT
            r.id, r.rating, r.comment, r.is_approved, r.created_at,
            u.name as user_name,
            p.name as product_name
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN products p ON r.product_id = p.id
    `;
    const queryParams = [];
    if (statusFilter === 'pending') {
        query += ` WHERE r.is_approved = false`;
    } else if (statusFilter === 'approved') {
        query += ` WHERE r.is_approved = true`;
    }
    // Default order, showing pending or newest first
    query += ` ORDER BY r.is_approved ASC, r.created_at DESC;`;

    try {
        const result = await pool.query(query, queryParams);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error("Error fetching reviews for admin:", err.message);
        res.status(500).json({ success: false, error: "Server error fetching reviews." });
    }
});

/**
 * [PUT /api/admin/reviews/:reviewId/approve]
 * Securely approves a review.
 * Protected by authenticateAdmin middleware.
 */
router.put('/reviews/:reviewId/approve', authenticateAdmin, async (req, res) => {
    const { reviewId } = req.params;
    try {
        const query = `
            UPDATE reviews SET is_approved = true, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND is_approved = false -- Only approve if currently pending
            RETURNING *;
        `;
        const result = await pool.query(query, [reviewId]);
        if (result.rows.length === 0) {
            // Might already be approved or not found
            const check = await pool.query('SELECT is_approved FROM reviews WHERE id = $1', [reviewId]);
            if (check.rows.length === 0) return res.status(404).json({ success: false, error: 'Review not found.' });
            if (check.rows[0].is_approved) return res.status(400).json({ success: false, error: 'Review is already approved.' });
             return res.status(404).json({ success: false, error: 'Review not found or could not be approved.' }); // Generic fallback
        }
        res.json({ success: true, message: 'Review approved successfully.', data: result.rows[0] });
    } catch (err) {
        console.error(`Error approving review ${reviewId}:`, err.message);
        res.status(500).json({ success: false, error: "Server error approving review." });
    }
});

/**
 * [DELETE /api/admin/reviews/:reviewId]
 * Securely deletes a review.
 * Protected by authenticateAdmin middleware.
 */
router.delete('/reviews/:reviewId', authenticateAdmin, async (req, res) => {
    const { reviewId } = req.params;
    try {
        const query = `DELETE FROM reviews WHERE id = $1 RETURNING *;`;
        const result = await pool.query(query, [reviewId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Review not found.' });
        }
        res.json({ success: true, message: 'Review deleted successfully.' });
    } catch (err) {
        console.error(`Error deleting review ${reviewId}:`, err.message);
        res.status(500).json({ success: false, error: "Server error deleting review." });
    }
});


// module.exports = router; // Should be at the very end

// Export the router so it can be used in server.js
module.exports = router;