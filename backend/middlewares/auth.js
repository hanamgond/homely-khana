//backend/middleware/auth.js
const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
    console.log("🔐 [auth-middleware] Starting token authentication");
    console.log("🔐 [auth-middleware] Request URL:", req.method, req.url);
    
    const authHeader = req.headers['authorization'];
    console.log("🔐 [auth-middleware] Authorization header present:", !!authHeader);
    
    if (authHeader) {
        console.log("🔐 [auth-middleware] Header value (first 30 chars):", authHeader.substring(0, 30) + '...');
    }
    
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        console.error("❌ [auth-middleware] No token provided");
        return res.status(401).json({ 
            success: false,
            error: "Access denied. No token provided." 
        });
    }

    console.log("🔐 [auth-middleware] Token (first 30 chars):", token.substring(0, 30) + '...');
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error("❌ [auth-middleware] JWT verification error:", err.message);
            return res.status(403).json({ 
                success: false,
                error: "Invalid or expired token." 
            });
        }
        
        console.log("✅ [auth-middleware] JWT verified successfully");
        console.log("🔐 [auth-middleware] Decoded JWT payload:", JSON.stringify(decoded, null, 2));
        
        // Debug: Check what properties are in the decoded token
        console.log("🔐 [auth-middleware] Available properties in decoded:", Object.keys(decoded));
        console.log("🔐 [auth-middleware] decoded.userId:", decoded.userId);
        console.log("🔐 [auth-middleware] decoded.id:", decoded.id);
        
        // Standardize the user object - handle both patterns
        const userId = decoded.userId || decoded.id;
        if (!userId) {
            console.error("❌ [auth-middleware] No user ID found in token!");
            return res.status(403).json({ 
                success: false,
                error: "Invalid token: No user ID found." 
            });
        }
        
        req.user = {
            id: userId,
            userId: userId, // Keep for backward compatibility
            name: decoded.name,
            email: decoded.email,
            phone: decoded.phone,
            role: decoded.role
        };
        
        console.log("✅ [auth-middleware] Normalized req.user:", req.user);
        console.log("✅ [auth-middleware] Proceeding to route handler...");
        next();
    });
};

const authenticateAdmin = (req, res, next) => {
    console.log("🔐 [admin-auth-middleware] Starting admin authentication");
    
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    
    if (!token) {
        console.error("❌ [admin-auth-middleware] No token provided");
        return res.status(401).json({ 
            success: false,
            error: "Access denied" 
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error("❌ [admin-auth-middleware] JWT verification error:", err.message);
            return res.status(403).json({ 
                success: false,
                error: "Invalid token" 
            });
        }
        
        console.log("🔐 [admin-auth-middleware] Decoded JWT:", decoded);
        
        if (decoded.role !== 'admin') {
            console.error("❌ [admin-auth-middleware] Non-admin user attempted admin access:", decoded.role);
            return res.status(403).json({ 
                success: false,
                error: "Forbidden: Admin access required" 
            });
        }
        
        const userId = decoded.userId || decoded.id;
        req.user = {
            id: userId,
            userId: userId,
            name: decoded.name,
            email: decoded.email,
            phone: decoded.phone,
            role: decoded.role
        };
        
        console.log("✅ [admin-auth-middleware] Admin access granted for:", req.user.email);
        next();
    });
};

// EXPLICIT EXPORT OBJECT
module.exports = { authenticateToken, authenticateAdmin };