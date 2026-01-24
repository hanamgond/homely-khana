// backend/db/setup.js
const bcrypt = require("bcrypt");
const pool = require("./db");

/**
 * FINALIZED SCHEMA SCRIPT (v4.0 - 7 Day Veg Menu)
 * * 1. Holistic User Management:
 * - Roles: Admin, Manager, Delivery, Kitchen.
 * - Features: Attendance, Wallet (COD), KYC Docs, Assets, Emergency Contact.
 * * 2. Dynamic Weekly Menu:
 * - Full 7-Day Cycle (Mon-Sun).
 * - 100% Vegetarian.
 * * 3. Core Business:
 * - Products, Subscriptions, Bookings, Deliveries, Reviews, Corporate Leads.
 *
 * Usage: node backend/db/setup.js
 * (Warning: Wipes existing data)
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

    // --- 1. DROP ALL TABLES & TYPES ---
    console.log("⚠️  WARNING: Dropping all existing data to apply new schema...");
    
    // Drop tables in correct dependency order
    await client.query(`
      DROP TABLE IF EXISTS "weekly_menu_items", "corporate_leads", "reviews", "deliveries", "booking_items", "bookings", "addresses", "subscription_plans", "products", "product_types", "users" CASCADE;
    `);
    
    // Drop all custom Enums
    await client.query(`
      DROP TYPE IF EXISTS booking_type_enum, payment_status_enum, payment_method_enum, delivery_status_enum, delivery_slot_enum, shift_status_enum, user_role_enum, day_of_week_enum, meal_type_enum;
    `);
    
    await client.query(`DROP FUNCTION IF EXISTS trigger_set_timestamp();`);

    // --- 2. CREATE EXTENSIONS & FUNCTIONS ---
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await createUpdateTimestampTrigger(client);

    // --- 3. CREATE ENUMS ---
    console.log("Creating ENUM types...");
    await client.query(`
      -- Core Booking Enums
      CREATE TYPE booking_type_enum AS ENUM ('one-time', 'subscription', 'both');
      CREATE TYPE payment_status_enum AS ENUM ('pending', 'completed', 'failed', 'refunded');
      CREATE TYPE payment_method_enum AS ENUM ('online', 'cod');
      
      -- Logistics Enums
      CREATE TYPE delivery_status_enum AS ENUM ('scheduled', 'out_for_delivery', 'delivered', 'cancelled', 'skipped');
      CREATE TYPE delivery_slot_enum AS ENUM ('asap', 'morning_9_12', 'afternoon_12_3', 'evening_4_7', 'lunch', 'dinner');
      
      -- Staff & Operations Enums
      CREATE TYPE shift_status_enum AS ENUM ('clocked_out', 'clocked_in', 'on_break');
      CREATE TYPE user_role_enum AS ENUM ('customer', 'admin', 'manager', 'delivery', 'kitchen');
      
      -- Menu Enums (Matches your UI)
      CREATE TYPE day_of_week_enum AS ENUM ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');
      CREATE TYPE meal_type_enum AS ENUM ('Lunch', 'Dinner');
    `);

    // --- 4. CREATE TABLES ---
    console.log("Creating tables...");

// 4.1 USERS (Holistic Model)
    await client.query(`
      CREATE TABLE "users" (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, 
        name VARCHAR(255) NOT NULL, 
        email VARCHAR(255) UNIQUE NOT NULL, 
        phone VARCHAR(15) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL, 
        
        -- ROLE & ACCESS
        role user_role_enum DEFAULT 'customer',
        is_active BOOLEAN DEFAULT true,
        permissions JSONB DEFAULT '{}',
        
        -- EMAIL VERIFICATION & SECURITY (ADDED FOR RESEND)
        is_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(255),
        reset_password_token VARCHAR(255),
        reset_password_expires BIGINT,

        -- OPERATIONS (Staff Specific)
        zone VARCHAR(100),
        kitchen_station VARCHAR(100),
        
        -- ATTENDANCE & FINANCE
        current_shift_status shift_status_enum DEFAULT 'clocked_out',
        last_active_at TIMESTAMPTZ,
        wallet_balance DECIMAL(10,2) DEFAULT 0.00,
        
        -- COMPLIANCE & HR
        documents JSONB DEFAULT '{}',
        assets JSONB DEFAULT '{}',
        emergency_contact JSONB DEFAULT '{}',
        fcm_token VARCHAR(500),

        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await applyUpdateTrigger(client, "users");

    // 4.2 ADDRESSES
    await client.query(`
      CREATE TABLE "addresses" (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, 
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL, 
        type VARCHAR(50) NOT NULL, 
        is_default BOOLEAN DEFAULT false,
        full_name VARCHAR(255) NOT NULL, 
        phone VARCHAR(15) NOT NULL, 
        address_line_1 VARCHAR(500) NOT NULL, 
        address_line_2 VARCHAR(500),
        city VARCHAR(100) NOT NULL, state VARCHAR(100) NOT NULL, pincode VARCHAR(10) NOT NULL, landmark VARCHAR(200),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await applyUpdateTrigger(client, "addresses");

    // 4.3 PRODUCTS & PLANS
    await client.query(`
      CREATE TABLE "product_types" (
        id SERIAL PRIMARY KEY, name VARCHAR(100) UNIQUE NOT NULL, description TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE "products" (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, 
        product_type_id INTEGER REFERENCES product_types(id) NOT NULL, 
        name VARCHAR(255) NOT NULL,
        description TEXT, image_url VARCHAR(500), 
        base_price DECIMAL(10,2) NOT NULL DEFAULT 0, 
        booking_type booking_type_enum NOT NULL,
        is_active BOOLEAN DEFAULT true, 
        stock_quantity INTEGER DEFAULT 0, max_quantity_per_order INTEGER DEFAULT 10,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await applyUpdateTrigger(client, "products");

    await client.query(`
      CREATE TABLE "subscription_plans" (
        id SERIAL PRIMARY KEY, 
        product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL, 
        plan_name VARCHAR(100) NOT NULL, description VARCHAR(500),
        price DECIMAL(10,2) NOT NULL, duration_days INTEGER NOT NULL, meals_per_day INTEGER DEFAULT 1, 
        sort_order INTEGER DEFAULT 0, is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4.4 BOOKINGS & LOGISTICS
    await client.query(`
      CREATE TABLE "bookings" (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, 
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL, 
        address_id UUID REFERENCES addresses(id) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL, 
        payment_method payment_method_enum NOT NULL, 
        payment_status payment_status_enum NOT NULL DEFAULT 'pending',
        cashfree_order_id VARCHAR(255), notes TEXT, 
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await applyUpdateTrigger(client, "bookings");

    await client.query(`
      CREATE TABLE "booking_items" (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, 
        booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL, 
        product_id UUID REFERENCES products(id) NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity >= 1), 
        subscription_plan_id INTEGER REFERENCES subscription_plans(id),
        price_per_unit DECIMAL(10,2) NOT NULL, total_price DECIMAL(10,2) NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE "deliveries" (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, 
        booking_item_id UUID REFERENCES booking_items(id) ON DELETE CASCADE NOT NULL, 
        assigned_to UUID REFERENCES users(id), -- Linked to Delivery Staff
        delivery_date DATE NOT NULL,
        delivery_slot delivery_slot_enum NOT NULL, 
        status delivery_status_enum NOT NULL DEFAULT 'scheduled', 
        delivery_address JSONB NOT NULL,
        delivery_instructions TEXT, meal_type VARCHAR(50), 
        scheduled_delivery_time TIME, delivered_at TIMESTAMPTZ, driver_notes TEXT
      );
    `);

    // 4.5 MISC (Reviews, Leads)
    await client.query(`
      CREATE TABLE "reviews" (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, 
        user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL, 
        product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND 5 >= rating), comment TEXT, is_approved BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_product_review UNIQUE (user_id, product_id)
      );
    `);
    await applyUpdateTrigger(client, "reviews");

    await client.query(`
      CREATE TABLE "corporate_leads" (
        id SERIAL PRIMARY KEY,
        organization_name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255) NOT NULL,
        direct_phone VARCHAR(50) NOT NULL,
        service_type VARCHAR(100),
        total_headcount INTEGER,
        specific_requirements TEXT,
        status VARCHAR(50) DEFAULT 'New',
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4.6 WEEKLY MENU (Matches your UI Requirements)
    await client.query(`
      CREATE TABLE "weekly_menu_items" (
        id SERIAL PRIMARY KEY,
        day_of_week day_of_week_enum NOT NULL, -- Mon, Tue...
        meal_type meal_type_enum NOT NULL,     -- Lunch/Dinner
        title VARCHAR(255) NOT NULL,           -- "Rajma Masala Feast"
        description TEXT,                      -- "The Classic Rajma..."
        calories INTEGER,                      -- 500
        tags JSONB DEFAULT '[]',               -- ["Comfort Food", "High Protein"]
        image_url VARCHAR(500),
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await applyUpdateTrigger(client, "weekly_menu_items");

    console.log("✅ All Tables Created.");

    // --- 5. INSERT INITIAL DATA ---
    console.log("Inserting initial data...");
    await client.query('BEGIN');

    // 5.1 Admin User
    const hash = await bcrypt.hash("password123", 10);
    const adminRes = await client.query(
      `INSERT INTO "users" (name, email, phone, password_hash, role, is_active) 
       VALUES ($1, $2, $3, $4, 'admin', true) RETURNING id;`,
      ['Hanamgond', 'hanamgond@example.com', '1234567890', hash]
    );
    const adminId = adminRes.rows[0].id;
    await client.query(
      `INSERT INTO "addresses" (user_id, type, full_name, phone, address_line_1, city, state, pincode, is_default) 
       VALUES ($1, 'Office', 'Hanamgond', '1234567890', 'HQ', 'Navi Mumbai', 'MH', '400703', true);`,
      [adminId]
    );

    // 5.2 Product Types & Products
    const typeRes = await client.query(`INSERT INTO "product_types" (name) VALUES ('Meals') RETURNING id;`);
    const mealTypeId = typeRes.rows[0].id;

    const products = [
        { name: 'Homely Meal', desc: 'Traditional home style', img: '/meal1.jpg', price: 4500 },
        { name: 'Healthy Meal', desc: 'Low calorie balanced', img: '/meal2.jpg', price: 5400 },
        { name: 'Complete Thali', desc: 'Full indian feast', img: '/meal3.jpg', price: 6000 },
        { name: 'Pulao Bowl', desc: 'Rice bowl series', img: '/meal4.jpg', price: 3600 }
    ];

    for (const p of products) {
        const pRes = await client.query(
          `INSERT INTO "products" (product_type_id, name, description, image_url, booking_type) 
           VALUES ($1, $2, $3, $4, 'subscription') RETURNING id;`,
          [mealTypeId, p.name, p.desc, p.img]
        );
        const pid = pRes.rows[0].id;
        await client.query(
          `INSERT INTO "subscription_plans" (product_id, plan_name, price, duration_days) VALUES 
            ($1, 'Monthly', $2, 30),
            ($1, 'Weekly', $3, 7),
            ($1, 'Trial', $4, 3);`,
          [pid, p.price, Math.round(p.price/4.2), Math.round(p.price/10)]
        );
    }

    // 5.3 WEEKLY MENU ITEMS (Full 7-Day Veg Cycle)
    const menuItems = [
      // MONDAY (New)
      { day: 'Monday', type: 'Lunch', title: 'Paneer & Peas Matar', cal: 450, tags: ['High Protein', 'Bestseller'], desc: 'Homely style Matar Paneer, Yellow Dal Tadka, Phulkas, Steamed Rice, Green Salad.' },
      { day: 'Monday', type: 'Dinner', title: 'Light Aloo Methi', cal: 380, tags: ['Light Digest', 'Detox'], desc: 'Fenugreek potatoes (Aloo Methi), Arhar Dal Fry, Phulkas, Cucumber Raita.' },

      // TUESDAY
      { day: 'Tuesday', type: 'Lunch', title: 'Rajma Masala Feast', cal: 500, tags: ['Comfort Food'], desc: 'The Classic Rajma, Jeera Rice, Carrot-Cucumber Salad, Phulkas.' },
      { day: 'Tuesday', type: 'Dinner', title: 'Bhindi Do Pyaza', cal: 350, tags: ['Low Carb Option'], desc: 'Okra with onions, Light Moong Dal, Phulkas, Steamed Rice.' },
      
      // WEDNESDAY
      { day: 'Wednesday', type: 'Lunch', title: 'Veg Jalfrezi Superbowl', cal: 420, tags: ['Fiber Rich'], desc: 'Mix veg with bell peppers, Dal Palak (Spinach), Rice, Phulkas.' },
      { day: 'Wednesday', type: 'Dinner', title: 'Egg Curry / Paneer Lababdar', cal: 480, tags: ['Protein Kick'], desc: 'Soft Paneer cubes in rich gravy, Steamed Rice, Phulkas, Roasted Papad.' },

      // THURSDAY
      { day: 'Thursday', type: 'Lunch', title: 'Kadhi Pakora & Rice', cal: 460, tags: ['Fan Favorite'], desc: 'Yogurt based curry, Steamed Rice, Dry Aloo Jeera, Fried Chilly.' },
      { day: 'Thursday', type: 'Dinner', title: 'Lauki Chana Dal', cal: 320, tags: ['Gut Health'], desc: 'Bottle Gourd with lentils (very light), Baingan Bharta, Phulkas.' },

      // FRIDAY
      { day: 'Friday', type: 'Lunch', title: 'Chole Masala Treat', cal: 550, tags: ['Indulgent'], desc: 'Rich Chickpea curry, Veg Pulao, Onion Salad, Phulkas.' },
      { day: 'Friday', type: 'Dinner', title: 'Dal Makhani Special', cal: 600, tags: ['Weekend Vibes'], desc: 'Creamy black lentils, Laccha Paratha, Jeera Rice, Small Sweet.' },

      // SATURDAY (New Weekend Special)
      { day: 'Saturday', type: 'Lunch', title: 'Baingan Bharta & Dal', cal: 430, tags: ['Smoky Flavor'], desc: 'Roasted eggplant mash, Mixed Dal Fry, Hot Phulkas, Rice.' },
      { day: 'Saturday', type: 'Dinner', title: 'Veg Makhanwala', cal: 520, tags: ['Rich Taste'], desc: 'Mixed vegetables in buttery tomato gravy, Jeera Rice, Paratha.' },

      // SUNDAY (New Sunday Feast)
      { day: 'Sunday', type: 'Lunch', title: 'Hyderabadi Veg Biryani', cal: 650, tags: ['Sunday Special'], desc: 'Aromatic Basmati rice layered with veggies, Mirchi ka Salan, Raita.' },
      { day: 'Sunday', type: 'Dinner', title: 'Sev Tamatar & Paratha', cal: 480, tags: ['Kathiyawadi Style'], desc: 'Spicy tomato curry with Sev, Triangle Parathas, Masala Buttermilk.' }
    ];

    for (const m of menuItems) {
      await client.query(
        `INSERT INTO "weekly_menu_items" (day_of_week, meal_type, title, description, calories, tags)
         VALUES ($1, $2, $3, $4, $5, $6);`,
        [m.day, m.type, m.title, m.desc, m.cal, JSON.stringify(m.tags)]
      );
    }
    console.log("✅ Weekly Menu Inserted (7 Days).");

    await client.query('COMMIT'); 
    console.log("🚀 SETUP COMPLETE.");

  } catch (err) {
    // FIX: Only rollback if the client was actually connected
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error("🚨 SETUP FAILED (Real Error Below):");
    console.error(err); // This will print the actual reason
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
};

setupDatabase();