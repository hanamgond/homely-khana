const express = require("express");
const pool = require("../db/db");
const { authenticateToken } = require("../middlewares/auth");
const { z } = require("zod");
const router = express.Router();

// --- 1. Zod Validation Schema ---
const reviewSchema = z.object({
  productId: z.number().or(z.string()),
  rating: z.number().min(1, "Minimum rating is 1").max(5, "Maximum rating is 5"),
  comment: z.string().max(500, "Comment is too long").optional().default("")
});

/**
 * [POST /add]
 * SECURE: Adds a new review for a product.
 */
router.post("/add", authenticateToken, async (req, res, next) => {
  console.log("🔍 [reviews/add] req.user:", req.user);
  console.log("🔍 [reviews/add] Using req.user.id:", req.user.id);
  
  const validation = reviewSchema.safeParse(req.body);
  
  if (!validation.success) {
    console.error("❌ [reviews/add] Validation failed:", validation.error.errors);
    const error = new Error("Invalid review data");
    error.statusCode = 400;
    error.details = validation.error.errors;
    return next(error);
  }

  const { productId, rating, comment } = validation.data;
  const userId = req.user.id;

  try {
    console.log("🔍 [reviews/add] Adding review for product:", productId, "by user:", userId);
    const result = await pool.query(
      `INSERT INTO "reviews" (user_id, product_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, productId, rating, comment]
    );
    console.log("🔍 [reviews/add] Review added successfully, ID:", result.rows[0].id);
    res.status(201).json({ success: true, data: result.rows[0], message: "Review added successfully." });
  } catch (err) {
    console.error("❌ [reviews/add] Error:", err.message);
    // Standardizing unique constraint violation (one review per user/product)
    if (err.code === '23505') { 
      console.error("❌ [reviews/add] Duplicate review attempted");
      const error = new Error("You have already reviewed this product.");
      error.statusCode = 400;
      return next(error);
    }
    next(err); // Global Error Handler for other database issues
  }
});

/**
 * [GET /product/:productId]
 * PUBLIC: Fetches all approved reviews for a specific product.
 */
router.get("/product/:productId", async (req, res, next) => {
  const { productId } = req.params;
  console.log("🔍 [reviews/product] Fetching reviews for product:", productId);

  try {
    const result = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.name as user_name
       FROM "reviews" r
       JOIN "users" u ON r.user_id = u.id
       WHERE r.product_id = $1 AND r.is_approved = true
       ORDER BY r.created_at DESC`,
      [productId]
    );
    console.log("🔍 [reviews/product] Found reviews:", result.rows.length);
    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    console.error("❌ [reviews/product] Error:", err.message);
    next(err);
  }
});

/**
 * [GET /user]
 * SECURE: Fetches reviews written by the currently logged-in user.
 */
router.get("/user", authenticateToken, async (req, res, next) => {
  console.log("🔍 [reviews/user] req.user:", req.user);
  console.log("🔍 [reviews/user] Using req.user.id:", req.user.id);
  
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT r.*, p.name as product_name, p.image_url as product_image_url
       FROM "reviews" r
       JOIN "products" p ON r.product_id = p.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );
    console.log("🔍 [reviews/user] Found reviews:", result.rows.length);
    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    console.error("❌ [reviews/user] Error:", err.message);
    next(err);
  }
});

module.exports = router;