// backend/routes/address.js
const express = require("express");
const pool = require("../db/db");
const authenticateToken = require("../middlewares/auth"); // Your existing auth middleware

const router = express.Router();

// --- 1. GET ALL ADDRESSES FOR THE LOGGED-IN USER ---
// SECURE: Uses middleware and req.user.userId
router.get("/all", authenticateToken, async (req, res) => {
  const userId = req.user.userId; // Get the user ID from the validated token

  try {
    const result = await pool.query(
      'SELECT * FROM "addresses" WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [userId]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Error fetching addresses:", err.stack);
    res.status(500).json({ success: false, error: "Failed to fetch addresses" });
  }
});

// --- 2. ADD A NEW ADDRESS ---
// SECURE: Uses middleware and assigns to req.user.userId
router.post("/add", authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { type, fullName, phone, addressLine1, addressLine2, city, state, pincode, landmark, isDefault } = req.body;

  // Basic validation
  if (!type || !fullName || !phone || !addressLine1 || !city || !state || !pincode) {
    return res.status(400).json({ success: false, error: "Missing required address fields." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN"); // Start transaction

    // If this new address is set as default, we must set all OTHERS to false first.
    if (isDefault) {
      await client.query(
        'UPDATE "addresses" SET is_default = false WHERE user_id = $1',
        [userId]
      );
    }

    // Insert the new address
    const result = await client.query(
      `INSERT INTO "addresses" (user_id, type, full_name, phone, address_line_1, address_line_2, city, state, pincode, landmark, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [userId, type, fullName, phone, addressLine1, addressLine2, city, state, pincode, landmark, isDefault || false]
    );

    await client.query("COMMIT"); // Commit transaction
    res.status(201).json({ success: true, data: result.rows[0], message: "Address added successfully." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error adding address:", err.stack);
    res.status(500).json({ success: false, error: "Failed to add address" });
  } finally {
    client.release();
  }
});

// --- 3. EDIT AN EXISTING ADDRESS ---
router.put("/edit/:id", authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const addressId = req.params.id; // The ID of the address to edit
  const { type, fullName, phone, addressLine1, addressLine2, city, state, pincode, landmark, isDefault } = req.body;

  if (!type || !fullName || !phone || !addressLine1 || !city || !state || !pincode) {
    return res.status(400).json({ success: false, error: "Missing required address fields." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // If this address is being set as default, set all others to false.
    if (isDefault) {
      await client.query(
        'UPDATE "addresses" SET is_default = false WHERE user_id = $1 AND id != $2',
        [userId, addressId]
      );
    }

    // Update the target address
    // We include "WHERE user_id = $11" to ensure a user can ONLY edit their own address.
    const result = await client.query(
      `UPDATE "addresses" SET
         type = $1, full_name = $2, phone = $3, address_line_1 = $4, address_line_2 = $5,
         city = $6, state = $7, pincode = $8, landmark = $9, is_default = $10,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $11 AND user_id = $12
       RETURNING *`,
      [type, fullName, phone, addressLine1, addressLine2, city, state, pincode, landmark, isDefault || false, addressId, userId]
    );

    if (result.rows.length === 0) {
      // This means the addressId didn't exist OR it didn't belong to the user
      await client.query("ROLLBACK");
      return res.status(404).json({ success: false, error: "Address not found or access denied." });
    }

    await client.query("COMMIT");
    res.status(200).json({ success: true, data: result.rows[0], message: "Address updated." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error updating address:", err.stack);
    res.status(500).json({ success: false, error: "Failed to update address" });
  } finally {
    client.release();
  }
});

// --- 4. DELETE AN ADDRESS ---
router.delete("/:id", authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const addressId = req.params.id;

  try {
    // We include "WHERE user_id = $2" to ensure a user can ONLY delete their own address.
    const result = await pool.query(
      'DELETE FROM "addresses" WHERE id = $1 AND user_id = $2 RETURNING *',
      [addressId, userId]
    );

    if (result.rows.length === 0) {
      // This means the addressId didn't exist OR it didn't belong to the user
      return res.status(404).json({ success: false, error: "Address not found or access denied." });
    }

    res.status(200).json({ success: true, message: "Address deleted successfully." });
  } catch (err) {
    console.error("Error deleting address:", err.stack);
    // Check for foreign key violation (if an order is using this address)
    if (err.code === '23503') {
       return res.status(400).json({ success: false, error: "Cannot delete this address as it is linked to past bookings." });
    }
    res.status(500).json({ success: false, error: "Failed to delete address" });
  }
});

// --- 5. SET AN ADDRESS AS DEFAULT ---
// This is a simpler, dedicated route for just clicking the "Set as Default" button.
router.post("/default/:id", authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const addressId = req.params.id;

    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        
        // 1. Set all addresses for this user to false
        await client.query(
            'UPDATE "addresses" SET is_default = false WHERE user_id = $1',
            [userId]
        );

        // 2. Set the target address to true
        const result = await client.query(
            'UPDATE "addresses" SET is_default = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING *',
            [addressId, userId]
        );

        if (result.rows.length === 0) {
             await client.query("ROLLBACK");
            return res.status(404).json({ success: false, error: "Address not found or access denied." });
        }

        await client.query("COMMIT");
        res.status(200).json({ success: true, data: result.rows[0], message: "Default address updated." });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error setting default address:", err.stack);
        res.status(500).json({ success: false, error: "Failed to set default address" });
    } finally {
        client.release();
    }
});


module.exports = router;