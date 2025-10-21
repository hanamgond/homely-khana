// backend/db/setup.js
const bcrypt = require("bcrypt");
const pool = require("./db");

/**
 * FINALIZED SCHEMA SCRIPT (v11.5 - Fixed 'pulaoId' ReferenceError)
 * - Fixes the bug where `pulaoId` was used before it was defined.
 * - Inserts 'Monthly', 'Weekly', and 'Trial' plans for all 4 meals.
 *
 * To run: node backend/db/setup.js
 */

const createUpdateTimestampTrigger = async (client) => {
  await client.query(`
    CREATE OR REPLACE FUNCTION trigger_set_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
};

const applyUpdateTrigger = async (client, tableName) => {
  await client.query(`
    DROP TRIGGER IF EXISTS set_timestamp ON "${tableName}";
    CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON "${tableName}"
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();
  `);
};

const setupDatabase = async () => {
  let client;
  try {
    client = await pool.connect();
    console.log("✅ Database connection successful. Starting final database setup...");

    // --- 1. DROP ALL TABLES & TYPES (FIXED) ---
    console.log("Dropping all existing tables & types for a clean slate...");
    
    // Drop tables first, with CASCADE to handle dependencies
    await client.query(`
      DROP TABLE IF EXISTS "reviews", "deliveries", "booking_items", "bookings", "addresses", "subscription_plans", "products", "product_types", "users" CASCADE;
    `);
    
    // Drop types
    await client.query(`
      DROP TYPE IF EXISTS booking_type_enum, payment_status_enum, payment_method_enum, delivery_status_enum, delivery_slot_enum;
    `);
    
    // Drop the trigger function
    await client.query(`
      DROP FUNCTION IF EXISTS trigger_set_timestamp();
    `);
    
    console.log("✅ Existing tables, types, and functions dropped successfully.");

    // --- 0. Add UUID extension (will be skipped if it already exists) ---
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');


    // --- 2. CREATE HELPER FUNCTION ---
    await createUpdateTimestampTrigger(client);

    // --- 3. CREATE ENUMS ---
    console.log("Creating ENUM types...");
    await client.query(`
      CREATE TYPE booking_type_enum AS ENUM ('one-time', 'subscription', 'both');
      CREATE TYPE payment_status_enum AS ENUM ('pending', 'completed', 'failed', 'refunded');
      CREATE TYPE payment_method_enum AS ENUM ('online', 'cod');
      CREATE TYPE delivery_status_enum AS ENUM ('scheduled', 'out_for_delivery', 'delivered', 'cancelled', 'skipped');
      CREATE TYPE delivery_slot_enum AS ENUM ('asap', 'morning_9_12', 'afternoon_12_3', 'evening_4_7', 'lunch', 'dinner');
    `);
    console.log("✅ ENUMs created successfully.");

    // --- 4. CREATE FINAL TABLES ---
    console.log("Creating production tables...");
    await client.query(`
      CREATE TABLE "users" (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL, phone VARCHAR(15) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL, role VARCHAR(50) DEFAULT 'customer', created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await applyUpdateTrigger(client, "users");
    await client.query(`
      CREATE TABLE "addresses" (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL, type VARCHAR(50) NOT NULL, is_default BOOLEAN DEFAULT false,
        full_name VARCHAR(255) NOT NULL, phone VARCHAR(15) NOT NULL, address_line_1 VARCHAR(500) NOT NULL, address_line_2 VARCHAR(500),
        city VARCHAR(100) NOT NULL, state VARCHAR(100) NOT NULL, pincode VARCHAR(10) NOT NULL, landmark VARCHAR(200),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await applyUpdateTrigger(client, "addresses");
    await client.query(`
      CREATE TABLE "product_types" (
        id SERIAL PRIMARY KEY, name VARCHAR(100) UNIQUE NOT NULL, description TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      CREATE TABLE "products" (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, product_type_id INTEGER REFERENCES product_types(id) NOT NULL, name VARCHAR(255) NOT NULL,
        description TEXT, image_url VARCHAR(500), base_price DECIMAL(10,2) NOT NULL DEFAULT 0, booking_type booking_type_enum NOT NULL,
        is_active BOOLEAN DEFAULT true, stock_quantity INTEGER DEFAULT 0, max_quantity_per_order INTEGER DEFAULT 10,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await applyUpdateTrigger(client, "products");
    await client.query(`
      CREATE TABLE "subscription_plans" (
        id SERIAL PRIMARY KEY, product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL, plan_name VARCHAR(100) NOT NULL, description VARCHAR(500),
        price DECIMAL(10,2) NOT NULL, duration_days INTEGER NOT NULL, meals_per_day INTEGER DEFAULT 1, sort_order INTEGER DEFAULT 0, is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      CREATE TABLE "bookings" (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL, address_id UUID REFERENCES addresses(id) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL, payment_method payment_method_enum NOT NULL, payment_status payment_status_enum NOT NULL DEFAULT 'pending',
        cashfree_order_id VARCHAR(255), notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await applyUpdateTrigger(client, "bookings");
    await client.query(`
      CREATE TABLE "booking_items" (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL, product_id UUID REFERENCES products(id) NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity >= 1), subscription_plan_id INTEGER REFERENCES subscription_plans(id),
        price_per_unit DECIMAL(10,2) NOT NULL, total_price DECIMAL(10,2) NOT NULL
      );
    `);
    await client.query(`
      CREATE TABLE "deliveries" (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, booking_item_id UUID REFERENCES booking_items(id) ON DELETE CASCADE NOT NULL, delivery_date DATE NOT NULL,
        delivery_slot delivery_slot_enum NOT NULL, status delivery_status_enum NOT NULL DEFAULT 'scheduled', delivery_address JSONB NOT NULL,
        delivery_instructions TEXT, meal_type VARCHAR(50), scheduled_delivery_time TIME, delivered_at TIMESTAMPTZ, driver_notes TEXT
      );
    `);
    await client.query(`
      CREATE TABLE "reviews" (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL, product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND 5 >= rating), comment TEXT, is_approved BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_product_review UNIQUE (user_id, product_id)
      );
    `);
    await applyUpdateTrigger(client, "reviews");
    console.log("✅ Production tables created successfully.");

    // --- 5. CREATE INDEXES ---
    console.log("Creating indexes for performance...");
    await client.query(`
      CREATE INDEX idx_users_phone ON users(phone); CREATE INDEX idx_addresses_user_id ON addresses(user_id); CREATE INDEX idx_products_type ON products(product_type_id);
      CREATE INDEX idx_products_active ON products(is_active); CREATE INDEX idx_subscription_plans_product ON subscription_plans(product_id);
      CREATE INDEX idx_bookings_user_id ON bookings(user_id); CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);
      CREATE INDEX idx_booking_items_booking ON booking_items(booking_id); CREATE INDEX idx_deliveries_date_slot ON deliveries(delivery_date, delivery_slot);
      CREATE INDEX idx_deliveries_status ON deliveries(status); CREATE INDEX idx_reviews_product ON reviews(product_id);
      CREATE INDEX idx_reviews_approved ON reviews(is_approved) WHERE is_approved = true;
    `);
    console.log("✅ Indexes created successfully.");

    // --- 6. INSERT DUMMY DATA (UPDATED with Weekly/Trial plans) ---
    console.log("Inserting updated dummy data with Monthly, Weekly, and Trial plans...");
    try {
        await client.query('BEGIN'); // Start transaction

        // --- Create a User and Address (Required for testing) ---
        const hashedPassword1 = await bcrypt.hash("password123", 10);
        const userResult = await client.query(
          `INSERT INTO "users" (name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING id;`,
          ['Hanamgond', 'hanamgond@example.com', '1234567890', hashedPassword1]
        );
        const userId = userResult.rows[0].id;
        await client.query(
          `INSERT INTO "addresses" (user_id, type, full_name, phone, address_line_1, city, state, pincode, is_default) VALUES ($1, 'Home', 'Hanamgond', '1234567890', '123 Tech Park', 'Navi Mumbai', 'Maharashtra', '400703', true);`,
          [userId]
        );
        console.log(` -> Created default user and address.`);

        // --- Create Product Type 'Meals' ---
        const typeResultMeals = await client.query(
            `INSERT INTO "product_types" (name, description) VALUES ('Meals', 'Daily meal subscriptions and one-time meals.') RETURNING id;`
        );
        const mealTypeId = typeResultMeals.rows[0].id;
        console.log(` -> Created product type: Meals`);

        // --- MEAL 1: Homely Meal (Subscription) ---
        // Per day price: 4500 / 30 = 150
        const homelyMealResult = await client.query(
          `INSERT INTO "products" (product_type_id, name, description, image_url, booking_type) VALUES ($1, 'Homely Meal', 'Traditional home-cooked meals that remind you of mom''s cooking', '/meal1.jpg', 'subscription') RETURNING id;`,
          [mealTypeId]
        );
        const homelyMealId = homelyMealResult.rows[0].id;
        await client.query(
          `INSERT INTO "subscription_plans" (product_id, plan_name, price, duration_days) VALUES 
            ($1, 'Monthly', 4500, 30),  -- 150/day
            ($1, 'Weekly', 1050, 7),   -- 150*7
            ($1, 'Trial', 450, 3);     -- 150*3
          `,
          [homelyMealId]
        );
        console.log(` -> Created product: Homely Meal (Monthly, Weekly, Trial plans)`);

        // --- MEAL 2: Healthy Meal (Subscription) ---
        // Per day price: 5400 / 30 = 180
        const healthyMealResult = await client.query(
          `INSERT INTO "products" (product_type_id, name, description, image_url, booking_type) VALUES ($1, 'Healthy Meal', 'Nutritious meals designed for a balanced and healthy lifestyle', '/meal2.jpg', 'subscription') RETURNING id;`,
          [mealTypeId]
        );
        const healthyMealId = healthyMealResult.rows[0].id;
        await client.query(
          `INSERT INTO "subscription_plans" (product_id, plan_name, price, duration_days) VALUES 
            ($1, 'Monthly', 5400, 30),  -- 180/day
            ($1, 'Weekly', 1260, 7),   -- 180*7
            ($1, 'Trial', 540, 3);     -- 180*3
          `,
          [healthyMealId]
        );
        console.log(` -> Created product: Healthy Meal (Monthly, Weekly, Trial plans)`);

        // --- MEAL 3: Complete Thali (NOW Subscription) ---
        // Per day price: 6000 / 30 = 200
        const thaliResult = await client.query(
          `INSERT INTO "products" (product_type_id, name, description, image_url, booking_type) VALUES ($1, 'Complete Thali', 'A wholesome indian thali with rice, dal, vegetables, roti and dessert', '/meal3.jpg', 'subscription') RETURNING id;`,
          [mealTypeId]
        );
        const thaliId = thaliResult.rows[0].id;
        await client.query(
          `INSERT INTO "subscription_plans" (product_id, plan_name, price, duration_days) VALUES 
            ($1, 'Monthly', 6000, 30),  -- 200/day
            ($1, 'Weekly', 1400, 7),   -- 200*7
            ($1, 'Trial', 600, 3);     -- 200*3
          `,
          [thaliId]
        );
        console.log(` -> Created product: Complete Thali (Monthly, Weekly, Trial plans)`);

        // --- MEAL 4: Vegetable Pulao Bowl (NOW Subscription) ---
        // Per day price: 3600 / 30 = 120
        const pulaoResult = await client.query(
          `INSERT INTO "products" (product_type_id, name, description, image_url, booking_type) VALUES ($1, 'Vegetable Pulao Bowl', 'Aromatic rice cooked with fresh seasonal vegetables and aromatic spices', '/meal4.jpg', 'subscription') RETURNING id;`,
          [mealTypeId] // <-- THIS WAS THE FIX
        );
        const pulaoId = pulaoResult.rows[0].id; 
        await client.query(
          `INSERT INTO "subscription_plans" (product_id, plan_name, price, duration_days) VALUES 
            ($1, 'Monthly', 3600, 30),  -- 120/day
            ($1, 'Weekly', 840, 7),    -- 120*7
            ($1, 'Trial', 360, 3);     -- 120*3
          `,
          [pulaoId]
        );
        console.log(` -> Created product: Vegetable Pulao Bowl (Monthly, Weekly, Trial plans)`);

        await client.query('COMMIT'); // Commit transaction
        console.log("✅ Updated dummy data for 4 subscription meals inserted successfully.");

    } catch (insertErr) {
        console.error("🚨 ERROR during dummy data insertion! Rolling back transaction. 🚨");
        console.error("Insertion Error details:", insertErr.stack);
        await client.query('ROLLBACK');
        throw insertErr;
    }
    // --- END OF DUMMY DATA INSERTION ---


    console.log("🚀🚀🚀 PRODUCTION DATABASE SETUP COMPLETE! 🚀🚀🚀");

  } catch (err) {
    console.error("🚨 DATABASE SETUP FAILED! 🚨");
    console.error("Error details:", err.stack);
    // Don't exit immediately if it's the insert error, we handled that above
    if (!err.message.includes("ERROR during dummy data insertion")) {
        process.exit(1);
    }
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
    console.log("Database connection pool closed.");
  }
};

// Run the setup function
setupDatabase();