export declare function initializeRedis(): Promise<void>;
export declare function getCache(key: string): Promise<string | null>;
export declare function setCache(key: string, value: string, ttlSeconds?: number): Promise<boolean>;
export declare function deleteCache(key: string): Promise<boolean>;
export declare function getCacheWithFallback<T>(key: string, fallbackFn: () => Promise<T>, ttlSeconds?: number): Promise<T>;
export declare function getCacheKey(...parts: string[]): string;
export declare function flushCache(): Promise<boolean>;
export declare function closeRedis(): Promise<void>;
//# sourceMappingURL=cache.d.ts.map