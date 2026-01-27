require('dotenv').config();
const express = require("express");
const cors = require("cors");
const pool = require("./db/db"); 
const redisClient = require("./lib/redis"); 
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// --- 1. Setup CORS ---
const allowedOrigins = [
    "http://homelykhana.in",
    "http://13.48.120.129",
    "http://localhost:3000", 
    "http://localhost:3001" 
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: "GET,POST,PUT,DELETE",
    credentials: true
}));

app.use(express.json()); 

// ⭐⭐⭐ ADD THIS EXACT DEBUG MIDDLEWARE ⭐⭐⭐
app.use((req, res, next) => {
    if (req.originalUrl.includes('address')) {
        console.log(`🔍 [ADDRESS-DEBUG] ${new Date().toISOString()}`);
        console.log(`   Method: ${req.method}`);
        console.log(`   Original URL: "${req.originalUrl}"`);
        console.log(`   Full URL: ${req.protocol}://${req.get('host')}${req.originalUrl}`);
        console.log(`   Path: ${req.path}`);
        console.log(`   Query:`, req.query);
        console.log(`   Headers:`, {
            'authorization': req.headers.authorization ? 'Present' : 'Missing',
            'content-type': req.headers['content-type'],
            'origin': req.headers.origin
        });
        console.log(`   Body keys:`, Object.keys(req.body));
    }
    next();
});
// ⭐⭐⭐ END DEBUG MIDDLEWARE ⭐⭐⭐
// --- 2.5 Request Logging Middleware ---
app.use((req, res, next) => {
    console.log(`\n📨 [${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    console.log('   Headers:', {
        authorization: req.headers.authorization ? 'Present' : 'Missing',
        origin: req.headers.origin,
        'user-agent': req.headers['user-agent']?.substring(0, 50) + '...'
    });
    
    // Store the original send function
    const originalSend = res.send;
    
    // Override send to log response
    res.send = function(body) {
        console.log(`📨 Response for ${req.method} ${req.originalUrl}:`);
        console.log('   Status:', res.statusCode);
        console.log('   Content-Type:', res.get('Content-Type'));
        
        // Try to parse as JSON to see if it's HTML
        if (typeof body === 'string') {
            if (body.trim().startsWith('<!DOCTYPE') || body.trim().startsWith('<html')) {
                console.error('❌ WARNING: Returning HTML instead of JSON!');
                console.error('   First 200 chars:', body.substring(0, 200));
            } else if (body.length < 500) {
                console.log('   Body:', body);
            }
        }
        
        // Call the original send function
        return originalSend.call(this, body);
    };
    
    next();
});

// --- 2. Health Check Endpoint (Refined) ---
app.get("/api/health", async (req, res) => {
    console.log("🔍 Health check requested");
    const healthStatus = {
        status: "UP",
        timestamp: new Date().toISOString(),
        services: {
            database: "DOWN",
            redis: "DOWN"
        }
    };

    try {
        // Ping Database
        await pool.query("SELECT 1");
        healthStatus.services.database = "UP";
        console.log("✅ Database connection OK");

        // Ping Redis (Ensuring client is connected)
        const redisPing = await redisClient.ping();
        if (redisPing === "PONG") {
            healthStatus.services.redis = "UP";
            console.log("✅ Redis connection OK");
        } else {
            console.log("⚠️ Redis ping returned:", redisPing);
        }

        res.status(200).json(healthStatus);
    } catch (err) {
        console.error("❌ Health check failed:", err.message);
        healthStatus.status = "DEGRADED";
        healthStatus.error = err.message;
        res.status(503).json(healthStatus);
    }
});

// --- 3. IMPORT ROUTES ---
const authRoutes = require("./routes/auth");
const productsRoutes = require("./routes/products");
const addressRoutes = require("./routes/address");
const bookingsRoutes = require("./routes/bookings");
const paymentsRoutes = require("./routes/payment");
const reviewsRoutes = require("./routes/reviews");
const adminRoutes = require("./routes/admin"); 
const userDashboardRoutes = require("./routes/userDashboard");
const corporateRoutes = require('./routes/corporate');
const teamRoutes = require('./routes/team');
const menuRoutes = require('./routes/menu');

// --- 4. REGISTER ROUTES ---
console.log("🔄 Registering routes...");
app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/address", addressRoutes); 
app.use("/api/addresses", addressRoutes); // Support plural too for frontend compatibility
app.use("/api/bookings", bookingsRoutes);
app.use("/api/payment", paymentsRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/admin", adminRoutes); 
app.use('/api/userDashboard', userDashboardRoutes);
app.use('/api/corporate', corporateRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/menu', menuRoutes);

// --- 5. Catch-all for undefined routes ---
app.use('*', (req, res) => {
    console.log(`❌ Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ 
        success: false, 
        error: `Route ${req.originalUrl} not found`,
        message: "Check the API endpoint URL"
    });
});

// --- 6. Global Error Handler (MUST BE LAST) ---
app.use(errorHandler);

const port = process.env.PORT || 5000; 
app.listen(port, () => {
    console.log(`\n✅ [${process.env.NODE_ENV || 'development'}] Server running at http://localhost:${port}`);
    console.log(`📡 Available endpoints:`);
    console.log(`   - http://localhost:${port}/api/health`);
    console.log(`   - http://localhost:${port}/api/auth/debug-token`);
    console.log(`   - http://localhost:${port}/api/userDashboard/next-delivery`);
    console.log(`   - http://localhost:${port}/api/userDashboard/subscriptions`);
});