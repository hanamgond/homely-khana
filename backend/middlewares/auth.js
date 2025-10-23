if (process.env.NODE_ENV !== "production") {
  require('dotenv').config()
}

const jwt = require("jsonwebtoken");

// This is your original function, unchanged.
// It's for customer routes (e.g., placing an order, editing an address).
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
  
    if (!token) return res.status(401).json({ error: "Access denied" });
  
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ error: "Invalid token" });
      req.user = user;
      next();
    });
};

// --- NEW FUNCTION ---
// This is for admin routes. It first verifies the token,
// then it checks if the user's role is 'admin'.
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Access denied" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });

    // This is the new part
    if (user.role !== 'admin') {
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }

    req.user = user;
    next();
  });
};

// Export both functions
module.exports = {
  authenticateToken,
  authenticateAdmin
};