import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

let redisClient: RedisClientType | null = null;

export async function initializeRedis(): Promise<void> {
    try {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        const redisPassword = process.env.REDIS_PASSWORD;

        redisClient = createClient({
            url: redisUrl,
            password: redisPassword || undefined,
            socket: {
                connectTimeout: 5000,
                lazyConnect: true
            }
        });

        redisClient.on('error', (err) => {
            logger.error('Redis client error:', err);
        });

        redisClient.on('connect', () => {
            logger.info('Redis client connected');
        });

        redisClient.on('ready', () => {
            logger.info('Redis client ready');
        });

        redisClient.on('end', () => {
            logger.warn('Redis client connection ended');
        });

        await redisClient.connect();
        
        // Test the connection
        await redisClient.ping();
        logger.info('Redis connection verified');

    } catch (error) {
        logger.error('Failed to initialize Redis:', error);
        // Don't throw - allow service to run without cache
        redisClient = null;
    }
}

export async function getCache(key: string): Promise<string | null> {
    if (!redisClient) return null;
    
    try {
        return await redisClient.get(key);
    } catch (error) {
        logger.error(`Failed to get cache key ${key}:`, error);
        return null;
    }
}

export async function setCache(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    if (!redisClient) return false;
    
    try {
        const ttl = ttlSeconds || parseInt(process.env.CACHE_TTL_SECONDS || '300');
        await redisClient.setEx(key, ttl, value);
        return true;
    } catch (error) {
        logger.error(`Failed to set cache key ${key}:`, error);
        return false;
    }
}

export async function deleteCache(key: string): Promise<boolean> {
    if (!redisClient) return false;
    
    try {
        await redisClient.del(key);
        return true;
    } catch (error) {
        logger.error(`Failed to delete cache key ${key}:`, error);
        return false;
    }
}

export async function getCacheWithFallback<T>(
    key: string,
    fallbackFn: () => Promise<T>,
    ttlSeconds?: number
): Promise<T> {
    // Try to get from cache first
    const cached = await getCache(key);
    if (cached) {
        try {
            return JSON.parse(cached);
        } catch (error) {
            logger.warn(`Failed to parse cached value for key ${key}:`, error);
        }
    }

    // Get fresh data
    const freshData = await fallbackFn();
    
    // Cache the result
    await setCache(key, JSON.stringify(freshData), ttlSeconds);
    
    return freshData;
}

export function getCacheKey(...parts: string[]): string {
    return `odin:${parts.join(':')}`;
}

export async function flushCache(): Promise<boolean> {
    if (!redisClient) return false;
    
    try {
        await redisClient.flushDb();
        return true;
    } catch (error) {
        logger.error('Failed to flush cache:', error);
        return false;
    }
}

export async function closeRedis(): Promise<void> {
    if (redisClient) {
        try {
            await redisClient.quit();
            redisClient = null;
            logger.info('Redis connection closed');
        } catch (error) {
            logger.error('Error closing Redis connection:', error);
        }
    }
}