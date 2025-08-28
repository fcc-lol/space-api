import express from 'express';
import {fetchData} from './modules/spaceWeather.js';
import {getEarthImagery} from './modules/earthNow.js';
import {getNeoFeed} from './modules/nearEarthObjects.js';
import cache from './modules/cache.js';

const app = express();
const port = 3102;

// Middleware to parse JSON bodies
app.use(express.json());

// Register refresh functions with the cache
cache.registerRefreshFunction('solarflares', () => fetchData('solarFlares'));
cache.registerRefreshFunction('sep', () => fetchData('SEP'));
cache.registerRefreshFunction('cmes', () => fetchData('CMEs'));
cache.registerRefreshFunction('earthnow', () => getEarthImagery());
cache.registerRefreshFunction('neos', () => getNeoFeed());

app.get('/', (req, res) => {
  res.send('space-api');
});

app.get('/solarflares', async (req, res) => {
  console.log("Getting solar flares");
  
  // Check cache first
  const cacheKey = 'solarflares';
  let response = cache.get(cacheKey);
  
  if (!response) {
    // Fetch fresh data if not in cache
    response = await fetchData('solarFlares');
    cache.set(cacheKey, response);
  }
  
  res.json(response);
})

app.get('/sep', async (req, res) => {
  console.log("Getting SEPs")
  
  // Check cache first
  const cacheKey = 'sep';
  let response = cache.get(cacheKey);
  
  if (!response) {
    // Fetch fresh data if not in cache
    response = await fetchData('SEP');
    cache.set(cacheKey, response);
  }
  
  res.json(response);
});

app.get('/cmes', async (req, res) => {
  console.log("Getting coronal mass ejections")
  
  // Check cache first
  const cacheKey = 'cmes';
  let response = cache.get(cacheKey);
  
  if (!response) {
    // Fetch fresh data if not in cache
    response = await fetchData('CMEs');
    cache.set(cacheKey, response);
  }
  
  res.json(response);
});

app.get('/earthnow', async (req, res) => {
  // Check cache first
  const cacheKey = 'earthnow';
  let response = cache.get(cacheKey);
  
  if (!response) {
    // Fetch fresh data if not in cache
    response = await getEarthImagery();
    cache.set(cacheKey, response);
  }
  
  res.json(response);
});

app.get('/neos', async (req, res) => {
  // Check cache first
  const cacheKey = 'neos';
  let response = cache.get(cacheKey);
  
  if (!response) {
    // Fetch fresh data if not in cache
    response = await getNeoFeed();
    cache.set(cacheKey, response);
  }
  
  res.json(response);
});

// Add a cache status endpoint for debugging
app.get('/cache/status', (req, res) => {
  res.json(cache.getStatus());
});

// Force refresh endpoint - clear specific cache entry or all cache
app.post('/cache/refresh', (req, res) => {
  const { key } = req.body;
  
  if (key) {
    // Clear specific cache entry
    cache.cache.delete(key);
    cache.timestamps.delete(key);
    console.log(`Force refreshed cache for: ${key}`);
    res.json({ message: `Cache refreshed for ${key}` });
  } else {
    // Clear all cache entries
    cache.cache.clear();
    cache.timestamps.clear();
    console.log('Force refreshed all cache entries');
    res.json({ message: 'All cache entries refreshed' });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

