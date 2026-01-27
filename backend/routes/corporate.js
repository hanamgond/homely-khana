const express = require('express');
const router = express.Router();
const pool = require('../db/db');
const { z } = require('zod');
const { authenticateAdmin } = require('../middlewares/auth');

// --- 1. Zod Validation Schema ---
const corporateLeadSchema = z.object({
  organizationName: z.string().min(2, "Organization name is required").trim(),
  contactPerson: z.string().min(2, "Contact person name is required").trim(),
  directPhone: z.string().regex(/^[0-9]{10}$/, "Phone must be exactly 10 digits"),
  serviceType: z.string().optional().default('Daily Lunch'),
  totalHeadcount: z.preprocess(
    (val) => (val === "" || val === null ? 0 : Number(val)),
    z.number().min(0).default(0)
  ),
  specificRequirements: z.string().optional().default('')
});

/**
 * [POST /api/corporate/leads]
 * Public endpoint for organizations to request service.
 */
router.post('/leads', async (req, res, next) => {
  // Gatekeeper: Validate incoming lead data
  const validation = corporateLeadSchema.safeParse(req.body);
  
  if (!validation.success) {
    const error = new Error("Invalid lead data");
    error.statusCode = 400;
    error.details = validation.error.errors;
    return next(error);
  }

  const { 
    organizationName, 
    contactPerson, 
    directPhone, 
    serviceType, 
    totalHeadcount, 
    specificRequirements 
  } = validation.data;

  try {
    const query = `
      INSERT INTO corporate_leads 
      (organization_name, contact_person, direct_phone, service_type, total_headcount, specific_requirements)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const values = [
      organizationName, 
      contactPerson, 
      directPhone, 
      serviceType, 
      totalHeadcount, 
      specificRequirements
    ];

    const result = await pool.query(query, values);

    res.status(201).json({ 
      success: true,
      message: 'Request received! We will contact you shortly.', 
      lead: result.rows[0] 
    });

  } catch (error) {
    next(error); // Pass to Global Error Handler
  }
});

/**
 * [GET /api/corporate/leads]
 * Admin-only endpoint to view leads.
 */
router.get('/leads', authenticateAdmin, async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM corporate_leads ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

module.exports = router;