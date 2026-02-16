require("dotenv").config();
const bcrypt = require("bcrypt");
const pool = require("../db/db");

async function createOrUpdateAdmin() {
  try {
    const email = "hanamgond@homelykhana.in";
    const phone = "8879691647";
    const password = "Homely@2026";
    const name = "Hanamgond";

    console.log("🔐 Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("🔍 Checking if user exists...");
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log("♻️ User exists. Promoting to admin...");

      await pool.query(
        `
        UPDATE users
        SET 
          name = $1,
          phone = $2,
          password_hash = $3,
          role = 'admin',
          is_verified = true,
          is_active = true,
          updated_at = NOW()
        WHERE email = $4
        `,
        [name, phone, hashedPassword, email]
      );

      console.log("✅ Admin updated successfully.");
    } else {
      console.log("➕ Creating new admin...");

      await pool.query(
        `
        INSERT INTO users 
        (name, email, phone, password_hash, role, is_verified, is_active, created_at)
        VALUES ($1, $2, $3, $4, 'admin', true, true, NOW())
        `,
        [name, email, phone, hashedPassword]
      );

      console.log("✅ Admin created successfully.");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    process.exit(1);
  }
}

createOrUpdateAdmin();
