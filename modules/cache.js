class Cache {
    constructor() {
        this.cache = new Map();
        this.timestamps = new Map();
        this.defaultCacheDuration = 60 * 60 * 1000; // 1 hour in milliseconds
        this.refreshFunctions = new Map(); // Store refresh functions for each cache key
    }

    // Register a refresh function for a specific cache key
    registerRefreshFunction(key, refreshFunc) {
        this.refreshFunctions.set(key, refreshFunc);
    }

    _getCacheDuration(key) {
        const timestampData = this.timestamps.get(key);
        return (timestampData && timestampData.duration) ? timestampData.duration : this.defaultCacheDuration;
    }

    // Get cached data if it exists and is not expired
    get(key) {
        const timestampData = this.timestamps.get(key);
        const now = Date.now();
        
        if (timestampData && (now - timestampData.timestamp) < this._getCacheDuration(key)) {
            console.log(`Cache hit for ${key}`);
            return this.cache.get(key);
        }
        
        console.log(`Cache miss for ${key}`);
        return null;
    }

    // Set data in cache with current timestamp and optional custom duration
    set(key, data, duration = null) {
        this.cache.set(key, data);
        this.timestamps.set(key, {
            timestamp: Date.now(),
            duration: duration || this.defaultCacheDuration
        });
        console.log(`Cached data for ${key}`);
    }

    // Check if cache entry exists and is valid
    has(key) {
        const timestampData = this.timestamps.get(key);
        if (!timestampData) return false;
        
        const now = Date.now();
        const duration = this._getCacheDuration(key);
        return (now - timestampData.timestamp) < duration;
    }

    // Get cache status for debugging
    getStatus() {
        const status = {};
        const now = Date.now();
        
        for (const [key, timestampData] of this.timestamps) {
            const duration = this._getCacheDuration(key);
            const age = now - timestampData.timestamp;
            const isValid = age < duration;
            status[key] = {
                age: Math.round(age / 1000), // age in seconds
                isValid,                
                timeUntilExpiry: isValid ? Math.round((duration - age) / 1000) : 0
            };
        }
        
        return status;
    }

    // Clear expired entries
    cleanup() {
        const now = Date.now();
        for (const [key, timestampData] of this.timestamps) {
            const duration = this._getCacheDuration(key);
            if ((now - timestampData.timestamp) >= duration) {
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
// cache.refreshAll(); // It's better to let the first request populate the cache.

// Clean up expired entries every 30 minutes
setInterval(() => {
    console.log("Cleaning up expired cache");
    cache.cleanup();
}, 30 * 60 * 1000);

// Scheduled refresh every 15 minutes (except for satellites)
// setInterval(() => {
//     console.log("Refreshing all cache");
//     cache.refreshAll();
// }, 15 * 60 * 1000);

export default cache;
