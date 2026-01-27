//backend/routes/admin.js
const express = require('express');
const router = express.Router();
const pool = require('../db/db');
const { authenticateAdmin } = require('../middlewares/auth');
const { z } = require('zod');

// --- 1. Zod Validation Schemas with Transformations ---
const productSchema = z.object({
    name: z.string().min(1, "Product name is required").trim(),
    description: z.preprocess(
        (val) => val === "" || val === null || val === undefined ? null : String(val),
        z.string().nullable().optional()
    ),
    imageUrl: z.preprocess(
        (val) => val === "" || val === null || val === undefined ? null : String(val),
        z.string().nullable().optional()
    ),
    basePrice: z.preprocess(
        (val) => {
            if (val === "" || val === null || val === undefined) return undefined;
            const num = Number(val);
            return isNaN(num) ? undefined : num;
        },
        z.number().min(0, "Base price must be 0 or greater")
    ),
    bookingType: z.enum(['one-time', 'subscription', 'both'], {
        errorMap: () => ({ message: "Booking type must be 'one-time', 'subscription', or 'both'" })
    }),
    productTypeId: z.preprocess(
        (val) => {
            if (val === "" || val === null || val === undefined) return undefined;
            const num = Number(val);
            return isNaN(num) ? undefined : num;
        },
        z.number().positive("Invalid product type ID")
    ),
    isActive: z.preprocess(
        (val) => {
            if (val === 'true' || val === true || val === '1' || val === 1) return true;
            if (val === 'false' || val === false || val === '0' || val === 0) return false;
            return val;
        },
        z.boolean()
    )
});

const planSchema = z.object({
    planName: z.string().min(1, "Plan Name is required").trim(),
    description: z.preprocess(
        (val) => val === "" || val === null || val === undefined ? null : String(val),
        z.string().nullable().optional()
    ),
    price: z.preprocess(
        (val) => {
            if (val === "" || val === null || val === undefined) return undefined;
            const num = Number(val);
            return isNaN(num) ? undefined : num;
        },
        z.number().min(0, "Price must be 0 or greater")
    ),
    durationDays: z.preprocess(
        (val) => {
            if (val === "" || val === null || val === undefined) return undefined;
            const num = Number(val);
            return isNaN(num) ? undefined : num;
        },
        z.number().positive("Duration must be a positive number")
    ),
    mealsPerDay: z.preprocess(
        (val) => {
            if (val === "" || val === null || val === undefined) return 1;
            const num = Number(val);
            return isNaN(num) ? 1 : num;
        },
        z.number().positive("Meals per day must be positive").default(1)
    ),
    isActive: z.preprocess(
        (val) => {
            if (val === 'true' || val === true || val === '1' || val === 1) return true;
            if (val === 'false' || val === false || val === '0' || val === 0) return false;
            return val === undefined ? true : val;
        },
        z.boolean().default(true)
    ),
    sortOrder: z.preprocess(
        (val) => {
            if (val === "" || val === null || val === undefined) return 0;
            const num = Number(val);
            return isNaN(num) ? 0 : num;
        },
        z.number().int().default(0)
    )
});

// --- 2. Validation Error Handler Middleware ---
const validateWithZod = (schema) => (req, res, next) => {
    const validation = schema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({
            success: false,
            error: "Validation Failed",
            details: validation.error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }))
        });
    }
    req.validatedData = validation.data;
    next();
};

/**
 * [GET /api/admin/stats]
 */
router.get('/stats', authenticateAdmin, async (req, res, next) => {
  try {
    const [salesResult, ordersResult, subsResult, lunchResult, dinnerResult] = await Promise.all([
      pool.query(`SELECT SUM(total_amount) as totalSales FROM bookings WHERE payment_status = 'completed' AND created_at >= DATE_TRUNC('month', CURRENT_DATE);`),
      pool.query(`SELECT COUNT(id) as newOrders FROM bookings WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE);`),
      pool.query(`SELECT COUNT(DISTINCT bi.booking_id) as activeSubscriptions FROM booking_items bi JOIN deliveries d ON bi.id = d.booking_item_id WHERE bi.subscription_plan_id IS NOT NULL AND d.delivery_date >= CURRENT_DATE AND d.status = 'scheduled';`),
      pool.query(`SELECT COUNT(id) as mealsTodayLunch FROM deliveries WHERE delivery_date = CURRENT_DATE AND delivery_slot = 'lunch' AND status = 'scheduled';`),
      pool.query(`SELECT COUNT(id) as mealsTodayDinner FROM deliveries WHERE delivery_date = CURRENT_DATE AND delivery_slot = 'dinner' AND status = 'scheduled';`)
    ]);

    const stats = {
      totalSales: parseFloat(salesResult.rows[0].totalsales || 0),
      newOrders: parseInt(ordersResult.rows[0].neworders || 0),
      activeSubscriptions: parseInt(subsResult.rows[0].activesubscriptions || 0),
      mealsTodayLunch: parseInt(lunchResult.rows[0].mealstodaylunch || 0),
      mealsTodayDinner: parseInt(dinnerResult.rows[0].mealstodaydinner || 0)
    };

    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

/**
 * [GET /api/admin/bookings]
 */
router.get('/bookings', authenticateAdmin, async (req, res, next) => {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const offset = (page - 1) * limit;

    const { status, method, startDate, endDate, search: searchQuery } = req.query;

    let baseQuery = `SELECT b.id, b.created_at, b.total_amount, b.payment_method, b.payment_status, u.name as customer_name, u.email as customer_email FROM bookings b JOIN users u ON b.user_id = u.id`;
    let countQuery = `SELECT COUNT(b.id) FROM bookings b JOIN users u ON b.user_id = u.id`;
    let conditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (status) { conditions.push(`b.payment_status = $${paramIndex++}`); queryParams.push(status); }
    if (method) { conditions.push(`b.payment_method = $${paramIndex++}`); queryParams.push(method); }
    if (startDate) { conditions.push(`b.created_at >= $${paramIndex++}`); queryParams.push(startDate); }
    if (endDate) {
        const nextDay = new Date(endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        conditions.push(`b.created_at < $${paramIndex++}`);
        queryParams.push(nextDay.toISOString().split('T')[0]);
    }

    if (searchQuery) {
        conditions.push(`(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
        queryParams.push(`%${searchQuery}%`);
        paramIndex++;
    }

    if (conditions.length > 0) {
        const whereClause = ` WHERE ${conditions.join(' AND ')}`;
        baseQuery += whereClause;
        countQuery += whereClause;
    }

    baseQuery += ` ORDER BY b.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    const dataParams = [...queryParams, limit, offset];

    try {
        const bookingsResult = await pool.query(baseQuery, dataParams);
        const totalResult = await pool.query(countQuery, queryParams);

        const totalBookings = parseInt(totalResult.rows[0].count, 10);
        res.json({
            success: true,
            data: bookingsResult.rows,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalBookings / limit),
                totalItems: totalBookings,
                itemsPerPage: limit
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * [GET /api/admin/kitchen-prep]
 */
router.get('/kitchen-prep', authenticateAdmin, async (req, res, next) => {
    try {
        let targetDate = req.query.date || new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0];

        const query = `
            SELECT p.name as product_name, d.meal_type, SUM(bi.quantity) as total_quantity
            FROM deliveries d
            JOIN booking_items bi ON d.booking_item_id = bi.id
            JOIN products p ON bi.product_id = p.id
            WHERE d.delivery_date = $1 AND d.status = 'scheduled'
            GROUP BY p.name, d.meal_type
            ORDER BY d.meal_type, p.name;
        `;

        const result = await pool.query(query, [targetDate]);
        res.json({
            success: true,
            data: {
                date: targetDate,
                lunch: result.rows.filter(row => row.meal_type === 'lunch'),
                dinner: result.rows.filter(row => row.meal_type === 'dinner')
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * [GET /api/admin/dispatch-sheet]
 */
router.get('/dispatch-sheet', authenticateAdmin, async (req, res, next) => {
    try {
        let targetDate = req.query.date || new Date().toISOString().split('T')[0];
        const slotFilter = req.query.slot;
        let slotCondition = "";
        const queryParams = [targetDate];
        if (slotFilter === 'lunch' || slotFilter === 'dinner') {
            slotCondition = ` AND d.delivery_slot = $2`;
            queryParams.push(slotFilter);
        }

        const query = `
            SELECT d.id as delivery_id, d.delivery_date, d.delivery_slot, d.status, d.meal_type, bi.quantity, p.name as product_name, u.name as customer_name,
                a.phone as customer_phone, a.full_name as delivery_name, a.address_line_1, a.address_line_2, a.city, a.state, a.pincode, a.landmark, a.type as address_type, b.notes as booking_notes
            FROM deliveries d
            JOIN booking_items bi ON d.booking_item_id = bi.id
            JOIN products p ON bi.product_id = p.id
            JOIN bookings b ON bi.booking_id = b.id
            JOIN users u ON b.user_id = u.id
            JOIN LATERAL jsonb_to_record(d.delivery_address) as a(id UUID, type TEXT, is_default BOOLEAN, full_name TEXT, phone TEXT, address_line_1 TEXT, address_line_2 TEXT, city TEXT, state TEXT, pincode TEXT, landmark TEXT) ON true
            WHERE d.delivery_date = $1 AND d.status = 'scheduled' ${slotCondition}
            ORDER BY d.delivery_slot, a.pincode, customer_name;
        `;

        const result = await pool.query(query, queryParams);
        res.json({ success: true, data: result.rows, date: targetDate, slot: slotFilter || 'all' });
    } catch (err) {
        next(err);
    }
});

/**
 * [PRODUCT MANAGEMENT]
 */
router.get('/products', authenticateAdmin, async (req, res, next) => {
    try {
        const query = `SELECT p.*, pt.name as product_type_name FROM products p LEFT JOIN product_types pt ON p.product_type_id = pt.id ORDER BY p.created_at DESC;`;
        const result = await pool.query(query);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        next(err);
    }
});

router.post('/products', authenticateAdmin, validateWithZod(productSchema), async (req, res, next) => {
    try {
        const { name, description, imageUrl, basePrice, bookingType, productTypeId, isActive } = req.validatedData;
        const query = `INSERT INTO products (name, description, image_url, base_price, booking_type, product_type_id, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;`;
        const result = await pool.query(query, [name, description, imageUrl, basePrice, bookingType, productTypeId, isActive]);
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        next(err);
    }
});

router.put('/products/:id', authenticateAdmin, validateWithZod(productSchema), async (req, res, next) => {
    const { id } = req.params;
    try {
        const { name, description, imageUrl, basePrice, bookingType, productTypeId, isActive } = req.validatedData;
        const query = `UPDATE products SET name=$1, description=$2, image_url=$3, base_price=$4, booking_type=$5, product_type_id=$6, is_active=$7, updated_at=CURRENT_TIMESTAMP WHERE id=$8 RETURNING *;`;
        const result = await pool.query(query, [name, description, imageUrl, basePrice, bookingType, productTypeId, isActive, id]);
        if (result.rows.length === 0) {
            const error = new Error('Product not found.');
            error.statusCode = 404;
            return next(error);
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        next(err);
    }
});

/**
 * [SUBSCRIPTION PLANS]
 */
router.post('/products/:productId/plans', authenticateAdmin, validateWithZod(planSchema), async (req, res, next) => {
    const { productId } = req.params;
    try {
        const { planName, description, price, durationDays, mealsPerDay, isActive, sortOrder } = req.validatedData;
        const query = `INSERT INTO subscription_plans (product_id, plan_name, description, price, duration_days, meals_per_day, is_active, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;`;
        const result = await pool.query(query, [productId, planName, description, price, durationDays, mealsPerDay, isActive, sortOrder]);
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        next(err);
    }
});

router.delete('/plans/:planId', authenticateAdmin, async (req, res, next) => {
    const { planId } = req.params;
    try {
        const checkResult = await pool.query(`SELECT COUNT(*) FROM booking_items WHERE subscription_plan_id = $1;`, [planId]);
        if (parseInt(checkResult.rows[0].count) > 0) {
            const error = new Error('Cannot delete plan: it is currently associated with existing orders.');
            error.statusCode = 400;
            return next(error);
        }
        const result = await pool.query(`DELETE FROM subscription_plans WHERE id = $1 RETURNING *;`, [planId]);
        if (result.rows.length === 0) {
            const error = new Error('Subscription plan not found.');
            error.statusCode = 404;
            return next(error);
        }
        res.json({ success: true, message: 'Subscription plan deleted successfully.' });
    } catch (err) {
        next(err);
    }
});

/**
 * [CUSTOMER MANAGEMENT]
 */
router.get('/customers', authenticateAdmin, async (req, res, next) => {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '15', 10);
    const offset = (page - 1) * limit;
    const searchQuery = req.query.search;
    let baseQuery = `SELECT id, name, email, phone, role, created_at FROM users`;
    let qParams = [];
    if (searchQuery) {
        baseQuery += ` WHERE (name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1)`;
        qParams.push(`%${searchQuery}%`);
    }
    baseQuery += ` ORDER BY created_at DESC LIMIT $${qParams.length + 1} OFFSET $${qParams.length + 2}`;

    try {
        const usersResult = await pool.query(baseQuery, [...qParams, limit, offset]);
        const totalResult = await pool.query(`SELECT COUNT(id) FROM users` + (searchQuery ? ` WHERE (name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1)` : ""), qParams);
        res.json({
            success: true,
            data: usersResult.rows,
            pagination: { totalItems: parseInt(totalResult.rows[0].count) }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * [REVIEW MANAGEMENT]
 */
router.put('/reviews/:reviewId/approve', authenticateAdmin, async (req, res, next) => {
    const { reviewId } = req.params;
    try {
        const result = await pool.query(`UPDATE reviews SET is_approved = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND is_approved = false RETURNING *;`, [reviewId]);
        if (result.rows.length === 0) {
            const error = new Error('Review not found or already approved.');
            error.statusCode = 404;
            return next(error);
        }
        res.json({ success: true, message: 'Review approved successfully.', data: result.rows[0] });
    } catch (err) {
        next(err);
    }
});

module.exports = router;