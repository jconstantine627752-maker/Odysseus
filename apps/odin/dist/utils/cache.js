"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeRedis = initializeRedis;
exports.getCache = getCache;
exports.setCache = setCache;
exports.deleteCache = deleteCache;
exports.getCacheWithFallback = getCacheWithFallback;
exports.getCacheKey = getCacheKey;
exports.flushCache = flushCache;
exports.closeRedis = closeRedis;
const redis_1 = require("redis");
const logger_1 = require("./logger");
let redisClient = null;
async function initializeRedis() {
    try {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        const redisPassword = process.env.REDIS_PASSWORD;
        redisClient = (0, redis_1.createClient)({
            url: redisUrl,
            password: redisPassword || undefined,
            socket: {
                connectTimeout: 5000,
                lazyConnect: true
            }
        });
        redisClient.on('error', (err) => {
            logger_1.logger.error('Redis client error:', err);
        });
        redisClient.on('connect', () => {
            logger_1.logger.info('Redis client connected');
        });
        redisClient.on('ready', () => {
            logger_1.logger.info('Redis client ready');
        });
        redisClient.on('end', () => {
            logger_1.logger.warn('Redis client connection ended');
        });
        await redisClient.connect();
        // Test the connection
        await redisClient.ping();
        logger_1.logger.info('Redis connection verified');
    }
    catch (error) {
        logger_1.logger.error('Failed to initialize Redis:', error);
        // Don't throw - allow service to run without cache
        redisClient = null;
    }
}
async function getCache(key) {
    if (!redisClient)
        return null;
    try {
        return await redisClient.get(key);
    }
    catch (error) {
        logger_1.logger.error(`Failed to get cache key ${key}:`, error);
        return null;
    }
}
async function setCache(key, value, ttlSeconds) {
    if (!redisClient)
        return false;
    try {
        const ttl = ttlSeconds || parseInt(process.env.CACHE_TTL_SECONDS || '300');
        await redisClient.setEx(key, ttl, value);
        return true;
    }
    catch (error) {
        logger_1.logger.error(`Failed to set cache key ${key}:`, error);
        return false;
    }
}
async function deleteCache(key) {
    if (!redisClient)
        return false;
    try {
        await redisClient.del(key);
        return true;
    }
    catch (error) {
        logger_1.logger.error(`Failed to delete cache key ${key}:`, error);
        return false;
    }
}
async function getCacheWithFallback(key, fallbackFn, ttlSeconds) {
    // Try to get from cache first
    const cached = await getCache(key);
    if (cached) {
        try {
            return JSON.parse(cached);
        }
        catch (error) {
            logger_1.logger.warn(`Failed to parse cached value for key ${key}:`, error);
        }
    }
    // Get fresh data
    const freshData = await fallbackFn();
    // Cache the result
    await setCache(key, JSON.stringify(freshData), ttlSeconds);
    return freshData;
}
function getCacheKey(...parts) {
    return `odin:${parts.join(':')}`;
}
async function flushCache() {
    if (!redisClient)
        return false;
    try {
        await redisClient.flushDb();
        return true;
    }
    catch (error) {
        logger_1.logger.error('Failed to flush cache:', error);
        return false;
    }
}
async function closeRedis() {
    if (redisClient) {
        try {
            await redisClient.quit();
            redisClient = null;
            logger_1.logger.info('Redis connection closed');
        }
        catch (error) {
            logger_1.logger.error('Error closing Redis connection:', error);
        }
    }
}
//# sourceMappingURL=cache.js.map