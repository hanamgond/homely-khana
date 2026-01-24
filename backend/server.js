//backend/server.js 

if (process.env.NODE_ENV !== "production") {
    require('dotenv').config()
}

const express = require("express");
const cors = require("cors");
const app = express();
const corporateRoutes = require('./routes/corporate');
const teamRoutes = require('./routes/team');
const menuRoutes = require('./routes/menu');


// --- Define allowed origins ---
const allowedOrigins = [
    "http://homelykhana.in",
    "http://13.48.120.129",
    "http://localhost:3000", // Your customer frontend
    "http://localhost:3001"  // --- ADD THIS: Your new admin portal ---
];

// --- Setup CORS ---
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

// --- Middleware ---
app.use(express.json()); 

// --- IMPORT ALL OUR ROUTES ---
const authRoutes = require("./routes/auth");
const productsRoutes = require("./routes/products");
const addressRoutes = require("./routes/address");
const bookingsRoutes = require("./routes/bookings");
const paymentsRoutes = require("./routes/payment");
const reviewsRoutes = require("./routes/reviews");
const adminRoutes = require("./routes/admin"); 
const userDashboardRoutes = require("./routes/user-dashboard");// --- ADD THIS ---

// --- REGISTER ALL THE ROUTES ---
app.use(cors());
app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/addresses", addressRoutes); 
app.use("/api/bookings", bookingsRoutes);
app.use("/api/payment", paymentsRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/admin", adminRoutes); 
app.use('/api/user-dashboard', userDashboardRoutes);
app.use('/api/corporate', corporateRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/menu', menuRoutes);// --- ADD THIS ---

// --- Start server ---
const port = process.env.PORT || 5000; 
app.listen(port, () => {
    console.log(`✅ Server running at http://localhost:${port}`);
});