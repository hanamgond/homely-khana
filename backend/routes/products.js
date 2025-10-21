// backend/routes/products.js
const express = require("express");
const pool = require("../db/db");
const router = express.Router();

/**
 * GET ALL PRODUCTS
 * This is the main endpoint for your shop pages.
 * It's flexible and can be filtered by product type (e.g., 'Meals', 'Add-ons').
 *
 * THIS IS THE NEW UPGRADED QUERY:
 * It now uses json_agg to embed a 'plans' array directly into each product.
 */
router.get("/", async (req, res) => {
  const { type } = req.query; // e.g., "Meals" or "Add-ons"

  try {
    let queryParams = [];
    
    // This new query is much more powerful.
    // It joins products with their types and also aggregates
    // all of their subscription plans into a JSON array called 'plans'.
    let query = `
      SELECT 
        p.*, 
        pt.name as product_type_name,
        (
          SELECT json_agg(plans)
          FROM (
            SELECT *
            FROM "subscription_plans" sp
            WHERE sp.product_id = p.id AND sp.is_active = true
            ORDER BY sp.sort_order, sp.price
          ) plans
        ) as plans
      FROM "products" p
      JOIN "product_types" pt ON p.product_type_id = pt.id
      WHERE p.is_active = true
    `;

    if (type) {
      queryParams.push(type);
      query += " AND pt.name = $1 ORDER BY p.name ASC";
    } else {
      query += " ORDER BY pt.name, p.name ASC";
    }

    const result = await pool.query(query, queryParams);
    
    // Clean up null plans (replace 'null' with '[]')
    const products = result.rows.map(product => ({
      ...product,
      plans: product.plans || [] 
    }));
    
    res.status(200).json({ success: true, data: products });
  } catch (err) {
    console.error("Error fetching products:", err.stack);
    res.status(500).json({ success: false, error: "Failed to fetch products" });
  }
});

/**
 * GET A SINGLE PRODUCT (by ID)
 * This is for your "Product Details" page.
 * It also fetches the available subscription plans for that specific product.
 */
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ success: false, error: "Product ID is required." });
  }

  try {
    // 1. Get the main product details
    const productResult = await pool.query(
      `SELECT 
         p.*, 
         pt.name as product_type_name
       FROM "products" p
       JOIN "product_types" pt ON p.product_type_id = pt.id
       WHERE p.id = $1 AND p.is_active = true`,
      [id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Product not found." });
    }
    const product = productResult.rows[0];

    // 2. If the product is a subscription, get its plans
    let plans = [];
    if (product.booking_type === 'subscription' || product.booking_type === 'both') {
      const plansResult = await pool.query(
        'SELECT * FROM "subscription_plans" WHERE product_id = $1 AND is_active = true ORDER BY sort_order, price',
        [id]
      );
      plans = plansResult.rows;
    }

    res.status(200).json({ 
      success: true, 
      data: {
        ...product,
        plans: plans 
      } 
    });
  } catch (err) {
    console.error(`Error fetching product ${id}:`, err.stack);
    res.status(500).json({ success: false, error: "Failed to fetch product details" });
  }
});

module.exports = router;