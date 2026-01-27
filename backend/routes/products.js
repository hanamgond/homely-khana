//backend/routes/products.js

const express = require("express");
const pool = require("../db/db");
const redisClient = require("../lib/redis");
const router = express.Router();

/**
 * [GET /api/products]
 * Fetches all active products with nested subscription plans.
 * Optimized with Redis Shared Caching (24h TTL).
 */
router.get("/", async (req, res, next) => {
  const { type } = req.query;
  const cacheKey = type ? `products:${type}` : `products:all`;

  try {
    // 1. Check Shared Redis Cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: JSON.parse(cached), source: 'cache' });
    }

    // 2. Database Fetch with Subquery for Plans
    let queryParams = [];
    let query = `
      SELECT p.*, pt.name as product_type_name,
        (SELECT json_agg(plans) FROM (
            SELECT * FROM "subscription_plans" sp
            WHERE sp.product_id = p.id AND sp.is_active = true
            ORDER BY sp.sort_order, sp.price
          ) plans
        ) as plans
      FROM "products" p
      JOIN "product_types" pt ON p.product_type_id = pt.id
      WHERE p.is_active = true`;

    if (type) {
      queryParams.push(type);
      query += " AND pt.name = $1 ORDER BY p.name ASC";
    } else {
      query += " ORDER BY pt.name, p.name ASC";
    }

    const result = await pool.query(query, queryParams);
    const products = result.rows.map(p => ({ ...p, plans: p.plans || [] }));

    // 3. Set Shared Cache for all 10 instances
    await redisClient.setEx(cacheKey, 86400, JSON.stringify(products)); 
    
    res.status(200).json({ success: true, data: products });
  } catch (err) {
    next(err); // Pass to Global Error Handler
  }
});

/**
 * [GET /api/products/:id]
 * Fetches single product details and associated plans.
 */
router.get("/:id", async (req, res, next) => {
  const { id } = req.params;
  const cacheKey = `product:${id}`;

  try {
    // 1. Check Shared Cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: JSON.parse(cached), source: 'cache' });
    }

    // 2. Product Query
    const productResult = await pool.query(
      `SELECT p.*, pt.name as product_type_name FROM "products" p
       JOIN "product_types" pt ON p.product_type_id = pt.id
       WHERE p.id = $1 AND p.is_active = true`, [id]
    );

    if (productResult.rows.length === 0) {
      const error = new Error("Product not found");
      error.statusCode = 404;
      return next(error);
    }
    
    const product = productResult.rows[0];

    // 3. Subscription Plans Query
    let plans = [];
    if (product.booking_type !== 'none') {
      const plansResult = await pool.query(
        'SELECT * FROM "subscription_plans" WHERE product_id = $1 AND is_active = true ORDER BY sort_order, price', 
        [id]
      );
      plans = plansResult.rows;
    }

    const finalData = { ...product, plans };
    
    // 4. Set Shared Cache
    await redisClient.setEx(cacheKey, 86400, JSON.stringify(finalData));
    
    res.status(200).json({ success: true, data: finalData });
  } catch (err) {
    next(err); // Centralized Error Handling
  }
});

module.exports = router;