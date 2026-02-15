//backend/lib/redis.js
const { createClient } = require('redis');

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Error', err));

(async () => {
    await redisClient.connect();
    console.log('✅ Redis Connected: Shared Cache Active');
})();

module.exports = redisClient;