module.exports = {
  apps: [{
    name: "homely-khana-backend",
    script: "./server.js",
    // 1. Instance Scaling
    instances: 10, 
    exec_mode: "cluster",
    
    // 2. Memory Management
    max_memory_restart: "300M", // Restart if an instance leaks memory
    
    // 3. Environment Control
    env_production: {
      NODE_ENV: "production",
      PORT: 5000
    },
    env_development: {
      NODE_ENV: "development",
      PORT: 5000
    },

    // 4. Logging for your audit
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    error_file: "./logs/pm2-err.log",
    out_file: "./logs/pm2-out.log",
    merge_logs: true
  }]
};