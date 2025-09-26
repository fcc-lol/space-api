# Caching System Documentation

## Overview
This project now includes a comprehensive caching system that automatically caches API responses and refreshes them every hour. The system is designed to improve response times and reduce API calls to external services.

## How It Works

### 1. Cache Storage
- **In-Memory Storage**: Uses JavaScript Maps to store cached data and timestamps
- **Cache Duration**: 1 hour (3,600,000 milliseconds)
- **Automatic Cleanup**: Expired entries are automatically removed every 30 minutes

### 2. Caching Strategy
- **Lazy Loading**: Data is only fetched when first requested
- **Cache-First**: All requests check the cache before making external API calls
- **Automatic Refresh**: All cached data is automatically refreshed every hour

### 3. Cache Keys
The following endpoints are cached with their respective keys:
- `/solarflares` → `solarflares`
- `/sep` → `sep`
- `/cmes` → `cmes`
- `/earthnow` → `earthnow`
- `/neos` → `neos`
- `/launches` → `launches`

## API Endpoints

### Data Endpoints
All existing endpoints now use caching:
- `GET /solarflares` - Solar flare data
- `GET /sep` - Solar energetic particle data
- `GET /cmes` - Coronal mass ejection data
- `GET /earthnow` - Earth imagery data
- `GET /neos` - Near Earth Objects data
- `GET /launches` - Upcoming space launch data

### Cache Management Endpoints
- `GET /cache/status` - View cache status and statistics
- `POST /cache/refresh` - Force refresh cache entries

#### Cache Status Response
```json
{
  "solarflares": {
    "age": 1800,
    "isValid": true,
    "timeUntilExpiry": 1800
  },
  "earthnow": {
    "age": 3600,
    "isValid": false,
    "timeUntilExpiry": 0
  }
}
```

#### Force Refresh Usage
```bash
# Refresh specific cache entry
curl -X POST http://localhost:3102/cache/refresh \
  -H "Content-Type: application/json" \
  -d '{"key": "solarflares"}'

# Refresh all cache entries
curl -X POST http://localhost:3102/cache/refresh \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Implementation Details

### Cache Class (`modules/cache.js`)
- **Singleton Pattern**: Single cache instance across the application
- **Timestamp Tracking**: Each cache entry includes creation timestamp
- **Automatic Cleanup**: Scheduled cleanup of expired entries
- **Refresh Functions**: Registered functions for each cache key

### Server Integration (`server.js`)
- **Middleware**: JSON body parsing for cache management endpoints
- **Function Registration**: All refresh functions registered at startup
- **Cache Integration**: Each endpoint checks cache before making API calls

## Benefits

1. **Performance**: Cached responses return instantly
2. **Reduced API Calls**: External API calls only when cache is empty or expired
3. **Automatic Management**: No manual intervention required
4. **Monitoring**: Built-in cache status and management endpoints
5. **Reliability**: Automatic fallback to fresh data if cache fails

## Testing

Run the test script to verify caching functionality:
```bash
node test-cache.js
```

This will test:
- Cache miss scenarios (first request)
- Cache hit scenarios (subsequent requests)
- Cache status monitoring
- Multiple endpoint caching

## Monitoring

### Console Logs
The system provides detailed logging:
- Cache hits and misses
- Data caching operations
- Scheduled refresh operations
- Cleanup operations

### Cache Status
Use `/cache/status` to monitor:
- Age of cached data
- Validity status
- Time until expiry

## Configuration

### Cache Duration
To modify cache duration, edit `modules/cache.js`:
```javascript
this.cacheDuration = 60 * 60 * 1000; // 1 hour in milliseconds
```

### Cleanup Interval
To modify cleanup frequency:
```javascript
setInterval(() => {
    cache.cleanup();
}, 30 * 60 * 1000); // 30 minutes
```

### Refresh Interval
To modify refresh frequency:
```javascript
setInterval(() => {
    cache.refreshAll();
}, 60 * 60 * 1000); // 1 hour
```

## Troubleshooting

### Common Issues
1. **Cache Not Working**: Check if cache module is properly imported
2. **Data Not Refreshing**: Verify refresh functions are registered
3. **Memory Issues**: Monitor cache size via `/cache/status`

### Debug Mode
Enable additional logging by modifying the cache class to include more verbose console output.

## Future Enhancements

1. **Persistent Storage**: Save cache to disk for server restarts
2. **Cache Compression**: Compress large responses
3. **Cache Analytics**: Track hit/miss ratios and performance metrics
4. **Distributed Caching**: Redis or similar for multi-instance deployments
