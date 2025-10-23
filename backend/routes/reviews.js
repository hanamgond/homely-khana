// backend/routes/reviews.js
const express = require("express");
const pool = require("../db/db");
const { authenticateToken } = require("../middlewares/auth"); // Import auth middleware

const router = express.Router();

/**
 * POST /add
 * Adds a new review for a product.
 * SECURE: Only a logged-in user can add a review.
 */
router.post("/add", authenticateToken, async (req, res) => {
  const { productId, rating, comment } = req.body;
  const { userId } = req.user; // Get user ID from the token

  if (!productId || !rating) {
    return res.status(400).json({ success: false, error: "Product ID and rating are required." });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, error: "Rating must be between 1 and 5." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO "reviews" (user_id, product_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, productId, rating, comment]
    );
    res.status(201).json({ success: true, data: result.rows[0], message: "Review added successfully." });
  } catch (err) {
    console.error("Error adding review:", err.stack);
    // Check for the unique constraint violation
    if (err.code === '23505') { 
      return res.status(400).json({ success: false, error: "You have already reviewed this product." });
    }
    res.status(500).json({ success: false, error: "Failed to add review." });
  }
});

/**
 * GET /product/:productId
 * Fetches all approved reviews for a specific product.
 * PUBLIC: Anyone can read reviews.
 */
router.get("/product/:productId", async (req, res) => {
  const { productId } = req.params;

  try {
    const result = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.name as user_name
       FROM "reviews" r
       JOIN "users" u ON r.user_id = u.id
       WHERE r.product_id = $1 AND r.is_approved = true
       ORDER BY r.created_at DESC`,
      [productId]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Error fetching reviews:", err.stack);
    res.status(500).json({ success: false, error: "Failed to fetch reviews." });
  }
});

/**
 * GET /user
 * Fetches all reviews written by the currently logged-in user.
 * SECURE: You can only see your own reviews.
 */
router.get("/user", authenticateToken, async (req, res) => {
  const { userId } = req.user;

  try {
    const result = await pool.query(
      `SELECT r.*, p.name as product_name, p.image_url as product_image_url
       FROM "reviews" r
       JOIN "products" p ON r.product_id = p.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Error fetching user's reviews:", err.stack);
    res.status(500).json({ success: false, error: "Failed to fetch your reviews." });
  }
});

module.exports = router;