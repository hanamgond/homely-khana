const { Pool } = require("pg");

// We tell the Pool EXACTLY which variable goes where.
// This bypasses the "Invalid URL" parsing error.
const pool = new Pool({
  user: process.env.DB_USER,      // 'postgres'
  host: process.env.DB_HOST,      // 'localhost'
  database: process.env.DB_DATABASE, // 'homelykhana'
  password: process.env.DB_PASSWORD, // 'Homely@25'
  port: process.env.DB_PORT,      // 5432
  
  // Settings to handle your 10 instances efficiently
  max: 20, 
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  console.log("🐘 PostgreSQL connected using Object Configuration");
});

module.exports = pool;