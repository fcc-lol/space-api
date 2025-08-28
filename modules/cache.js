class Cache {
    constructor() {
        this.cache = new Map();
        this.timestamps = new Map();
        this.cacheDuration = 60 * 60 * 1000; // 1 hour in milliseconds
        this.refreshFunctions = new Map(); // Store refresh functions for each cache key
    }

    // Register a refresh function for a specific cache key
    registerRefreshFunction(key, refreshFunc) {
        this.refreshFunctions.set(key, refreshFunc);
    }

    // Get cached data if it exists and is not expired
    get(key) {
        const timestamp = this.timestamps.get(key);
        const now = Date.now();
        
        if (timestamp && (now - timestamp) < this.cacheDuration) {
            console.log(`Cache hit for ${key}`);
            return this.cache.get(key);
        }
        
        console.log(`Cache miss for ${key}`);
        return null;
    }

    // Set data in cache with current timestamp
    set(key, data) {
        this.cache.set(key, data);
        this.timestamps.set(key, Date.now());
        console.log(`Cached data for ${key}`);
    }

    // Check if cache entry exists and is valid
    has(key) {
        const timestamp = this.timestamps.get(key);
        if (!timestamp) return false;
        
        const now = Date.now();
        return (now - timestamp) < this.cacheDuration;
    }

    // Get cache status for debugging
    getStatus() {
        const status = {};
        const now = Date.now();
        
        for (const [key, timestamp] of this.timestamps) {
            const age = now - timestamp;
            const isValid = age < this.cacheDuration;
            status[key] = {
                age: Math.round(age / 1000), // age in seconds
                isValid,
                timeUntilExpiry: isValid ? Math.round((this.cacheDuration - age) / 1000) : 0
            };
        }
        
        return status;
    }

    // Clear expired entries
    cleanup() {
        const now = Date.now();
        for (const [key, timestamp] of this.timestamps) {
            if ((now - timestamp) >= this.cacheDuration) {
                this.cache.delete(key);
                this.timestamps.delete(key);
                console.log(`Cleaned up expired cache entry: ${key}`);
            }
        }
    }

    // Force refresh all cached data
    async refreshAll() {
        console.log('Starting scheduled refresh of all cached data...');
        
        for (const [key, refreshFunc] of this.refreshFunctions) {
            try {
                console.log(`Refreshing cache for: ${key}`);
                const freshData = await refreshFunc();
                this.set(key, freshData);
                console.log(`Successfully refreshed cache for: ${key}`);
            } catch (error) {
                console.error(`Failed to refresh cache for ${key}:`, error);
            }
        }
        
        console.log('Scheduled refresh completed');
    }

    // Force refresh specific cache entry
    async refresh(key) {
        const refreshFunc = this.refreshFunctions.get(key);
        if (!refreshFunc) {
            throw new Error(`No refresh function registered for key: ${key}`);
        }
        
        try {
            console.log(`Force refreshing cache for: ${key}`);
            const freshData = await refreshFunc();
            this.set(key, freshData);
            console.log(`Successfully refreshed cache for: ${key}`);
            return freshData;
        } catch (error) {
            console.error(`Failed to refresh cache for ${key}:`, error);
            throw error;
        }
    }
}

// Create a singleton instance
const cache = new Cache();
cache.refreshAll();

// Clean up expired entries every 30 minutes
setInterval(() => {
    console.log("Cleaning up expired cache");
    cache.cleanup();
}, 30 * 60 * 1000);

// Scheduled refresh every hour
setInterval(() => {
    console.log("Refreshing all cache");
    cache.refreshAll();
}, 60 * 60 * 1000);

export default cache;
