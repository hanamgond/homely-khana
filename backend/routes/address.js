//backend/routes/address.js

const express = require("express");
const pool = require("../db/db");
const { authenticateToken } = require("../middlewares/auth");
const { z } = require("zod");
const router = express.Router();

// --- 1. RESILIENT VALIDATION SCHEMA ---
const addressSchema = z.object({
  type: z.enum(['home', 'work', 'other']).or(z.string().transform(v => v.toLowerCase())),
  fullName: z.string().min(2).max(100),
  phone: z.string().regex(/^[0-9]{10}$/, "Invalid phone number"),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional().nullable(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.union([z.string(), z.number()])
    .transform(v => String(v))
    .refine(v => /^[0-9]{6}$/.test(v), "Invalid pincode"),
  landmark: z.string().optional().nullable(),
  isDefault: z.boolean().optional().default(false),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable()
});

// --- 2. GET ALL ADDRESSES ---
router.get("/all", authenticateToken, async (req, res, next) => {
  console.log("🔍 [address/all] req.user:", req.user);
  console.log("🔍 [address/all] Using req.user.id:", req.user.id);
  
  const userId = req.user.id;

  try {
    const result = await pool.query(
      'SELECT * FROM "addresses" WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [userId]
    );
    console.log("🔍 [address/all] Found addresses:", result.rows.length);
    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    console.error("❌ [address/all] Error:", err.message);
    next(err);
  }
});

// --- 3. ADD A NEW ADDRESS ---
router.post("/add", authenticateToken, async (req, res, next) => {
  console.log("🔍 [address/add] req.user:", req.user);
  console.log("🔍 [address/add] Using req.user.id:", req.user.id);
  
  const validation = addressSchema.safeParse(req.body);
if (!validation.success) {
  console.error("❌ [address/add] Validation failed DETAILS:");
  console.error("   Input data:", req.body);
  console.error("   Validation errors:", validation.error.errors);
  console.error("   Error format:", validation.error.format());
  
  const error = new Error("Invalid address data");
  error.statusCode = 400;
  error.details = validation.error.errors;
  return next(error);
}

  const userId = req.user.id;
  const { 
    type, fullName, phone, addressLine1, addressLine2, 
    city, state, pincode, landmark, isDefault, lat, lng 
  } = validation.data;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (isDefault) {
      console.log("🔍 [address/add] Setting other addresses as non-default for user:", userId);
      await client.query('UPDATE "addresses" SET is_default = false WHERE user_id = $1', [userId]);
    }

    const result = await client.query(
      `INSERT INTO "addresses" 
       (user_id, type, full_name, phone, address_line_1, address_line_2, city, state, pincode, landmark, is_default, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [userId, type, fullName, phone, addressLine1, addressLine2, city, state, pincode, landmark, isDefault, lat, lng]
    );

    await client.query("COMMIT");
    console.log("🔍 [address/add] Address added successfully, ID:", result.rows[0].id);
    res.status(201).json({ success: true, data: result.rows[0], message: "Address added successfully." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ [address/add] Error:", err.message);
    next(err);
  } finally {
    client.release();
  }
});

// --- 4. EDIT AN EXISTING ADDRESS ---
router.put("/edit/:id", authenticateToken, async (req, res, next) => {
  console.log("🔍 [address/edit] req.user:", req.user);
  console.log("🔍 [address/edit] Using req.user.id:", req.user.id);
  console.log("🔍 [address/edit] Address ID to edit:", req.params.id);
  
  const validation = addressSchema.safeParse(req.body);
  if (!validation.success) {
    console.error("❌ [address/edit] Validation failed:", validation.error.errors);
    const error = new Error("Invalid address data");
    error.statusCode = 400;
    error.details = validation.error.errors;
    return next(error);
  }

  const userId = req.user.id;
  const addressId = req.params.id;
  const { 
    type, fullName, phone, addressLine1, addressLine2, 
    city, state, pincode, landmark, isDefault, lat, lng 
  } = validation.data;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (isDefault) {
      console.log("🔍 [address/edit] Setting other addresses as non-default");
      await client.query(
        'UPDATE "addresses" SET is_default = false WHERE user_id = $1 AND id != $2',
        [userId, addressId]
      );
    }

    const result = await client.query(
      `UPDATE "addresses" SET
         type = $1, full_name = $2, phone = $3, address_line_1 = $4, address_line_2 = $5,
         city = $6, state = $7, pincode = $8, landmark = $9, is_default = $10,
         latitude = $11, longitude = $12, updated_at = CURRENT_TIMESTAMP
       WHERE id = $13 AND user_id = $14
       RETURNING *`,
      [type, fullName, phone, addressLine1, addressLine2, city, state, pincode, landmark, isDefault, lat, lng, addressId, userId]
    );

    if (result.rows.length === 0) {
      console.error("❌ [address/edit] Address not found or access denied");
      const error = new Error("Address not found or access denied.");
      error.statusCode = 404;
      throw error;
    }

    await client.query("COMMIT");
    console.log("🔍 [address/edit] Address updated successfully, ID:", result.rows[0].id);
    res.status(200).json({ success: true, data: result.rows[0], message: "Address updated." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ [address/edit] Error:", err.message);
    next(err);
  } finally {
    client.release();
  }
});

// --- 5. DELETE AN ADDRESS ---
router.delete("/:id", authenticateToken, async (req, res, next) => {
  console.log("🔍 [address/delete] req.user:", req.user);
  console.log("🔍 [address/delete] Using req.user.id:", req.user.id);
  console.log("🔍 [address/delete] Address ID to delete:", req.params.id);
  
  const userId = req.user.id;
  const addressId = req.params.id;

  try {
    const result = await pool.query(
      'DELETE FROM "addresses" WHERE id = $1 AND user_id = $2 RETURNING *',
      [addressId, userId]
    );

    if (result.rows.length === 0) {
      console.error("❌ [address/delete] Address not found or access denied");
      const error = new Error("Address not found or access denied.");
      error.statusCode = 404;
      throw error;
    }

    console.log("🔍 [address/delete] Address deleted successfully, ID:", result.rows[0].id);
    res.status(200).json({ success: true, message: "Address deleted successfully." });
  } catch (err) {
    console.error("❌ [address/delete] Error:", err.message);
    if (err.code === '23503') {
       const error = new Error("Cannot delete address linked to past bookings.");
       error.statusCode = 400;
       return next(error);
    }
    next(err);
  }
});

// --- 6. SET DEFAULT ADDRESS ---
router.post("/default/:id", authenticateToken, async (req, res, next) => {
    console.log("🔍 [address/default] req.user:", req.user);
    console.log("🔍 [address/default] Using req.user.id:", req.user.id);
    console.log("🔍 [address/default] Address ID to set as default:", req.params.id);
    
    const userId = req.user.id;
    const addressId = req.params.id;

    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        console.log("🔍 [address/default] Setting all addresses as non-default for user:", userId);
        await client.query('UPDATE "addresses" SET is_default = false WHERE user_id = $1', [userId]);

        const result = await client.query(
            'UPDATE "addresses" SET is_default = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING *',
            [addressId, userId]
        );

        if (result.rows.length === 0) {
             console.error("❌ [address/default] Address not found or access denied");
             const error = new Error("Address not found or access denied.");
             error.statusCode = 404;
             throw error;
        }

        await client.query("COMMIT");
        console.log("🔍 [address/default] Default address updated to ID:", result.rows[0].id);
        res.status(200).json({ success: true, data: result.rows[0], message: "Default address updated." });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("❌ [address/default] Error:", err.message);
        next(err);
    } finally {
        client.release();
    }
});

module.exports = router;