if (process.env.NODE_ENV !== "production") {
    require('dotenv').config()
}

const express = require("express");
const cors = require("cors");
const app = express();

// --- Define allowed origins ---
const allowedOrigins = [
    "http://homelykhana.in",
    "http://13.48.120.129",
    "http://localhost:3000" // Your frontend
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
    methods: "GET,POST,PUT,DELETE", // Added PUT and DELETE for our new address routes
    credentials: true
}));

// --- Middleware ---
app.use(express.json()); // This is the modern replacement for body-parser

// --- IMPORT ALL OUR NEW, REFACTORED ROUTES ---
const authRoutes = require("./routes/auth");
const productsRoutes = require("./routes/products");
const addressRoutes = require("./routes/address");
const bookingsRoutes = require("./routes/bookings");
const paymentsRoutes = require("./routes/payment");
const reviewsRoutes = require("./routes/reviews");

// --- REGISTER ALL THE NEW ROUTES ---
app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/addresses", addressRoutes); // Using plural '/addresses' to match the file
app.use("/api/bookings", bookingsRoutes);
app.use("/api/payment", paymentsRoutes);
app.use("/api/reviews", reviewsRoutes);

// --- Start server ---
const port = process.env.PORT || 5000; // Use port 5000 as a default
app.listen(port, () => {
    console.log(`✅ Server running at http://localhost:${port}`);
});