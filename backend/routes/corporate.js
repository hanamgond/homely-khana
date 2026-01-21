const express = require('express');
const router = express.Router();
const pool = require('../db/db'); // Use your existing pool connection

// POST: Create a new corporate lead
router.post('/leads', async (req, res) => {
  try {
    const { 
      organizationName, 
      contactPerson, 
      directPhone, 
      serviceType, 
      totalHeadcount, 
      specificRequirements 
    } = req.body;

    // 1. Basic Validation
    if (!organizationName || !contactPerson || !directPhone) {
      return res.status(400).json({ message: 'Organization, Contact Person, and Phone are required.' });
    }

    // 2. Insert into Database
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
      serviceType || 'Daily Lunch', 
      totalHeadcount || 0, 
      specificRequirements || ''
    ];

    const result = await pool.query(query, values);

    // 3. Send Success Response
    res.status(201).json({ 
      message: 'Request received! We will contact you shortly.', 
      lead: result.rows[0] 
    });

  } catch (error) {
    console.error('Error saving corporate lead:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

module.exports = router;
// GET: Fetch all corporate leads (For Admin Portal)
router.get('/leads', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM corporate_leads ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ message: 'Server error fetching leads.' });
  }
});

module.exports = router;