import express from 'express';
import {fetchData} from './modules/spaceWeather.js';
import {getEarthImageURL, getEarthImage, getEarthImageryMetadata} from './modules/earthNow.js';
import {satellitesAbove} from './modules/satellites.js';
import {convertDmsToDecimal} from './modules/coordinates.js';
import {getNeoFeed} from './modules/nearEarthObjects.js';
import cache from './modules/cache.js';
import setupLog from './setup-log.json' with { type: 'json' };
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3102;

// Middleware to parse JSON bodies
app.use(express.json());

// Enable CORS for all routes and origins
app.use(cors());

// Register refresh functions with the cache
cache.registerRefreshFunction('solarflares', () => fetchData('solarFlares'));
cache.registerRefreshFunction('sep', () => fetchData('SEP'));
cache.registerRefreshFunction('cmes', () => fetchData('CMEs'));
cache.registerRefreshFunction('neos', () => getNeoFeed());
// Note: We are not registering a global refresh function for satellites
// because its parameters (lat, lon) are request-specific.
// The cache for this endpoint will be populated on-demand by user requests.
setInterval(() => {
    cache.refreshAll(); // This will refresh solarflares, sep, cmes, neos
}, 15 * 60 * 1000); // Refresh every 15 minutes

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
    response = await fetchData('solarFlares', req.query.startDate || null, req.query.endDate || null);
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
    response = await fetchData('SEP', req.query.startDate || null, req.query.endDate || null);
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
    response = await fetchData('CMEs', req.query.startDate || null, req.query.endDate || null);
    cache.set(cacheKey, response);
  }
  
  res.json(response);
});

app.get('/earthnow/list', async (req, res) => {
  try {
    const date = req.query.date || 'latest';
    const variant = req.query.variant || 'natural';

    const cacheKey = `earthnow_list_${date}_${variant}`;
    let response = cache.get(cacheKey);

    if (!response) {
      response = await getEarthImageryMetadata(date, variant);
      cache.set(cacheKey, response);
    }

    res.json(response);
  } catch (error) {
    console.error('Error fetching Earth imagery list:', error);
    res.status(500).json({ error: 'Failed to fetch Earth imagery list', message: error.message });
  }
});


app.get('/earthnow/imageurl', async (req, res) => {
  try {
    const date = req.query.date || 'latest';
    const variant = req.query.variant || 'natural';
    const index = req.query.index || 0;
    const response = await getEarthImageURL(date, variant, index);
    res.json(response);
  } catch (error) {
    console.error('Error serving Earth image:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Earth image', 
      message: error.message 
    });
  }
});

app.get('/earthnow/image', async (req, res) => {
  try {
    const date = req.query.date || 'latest';
    const variant = req.query.variant || 'natural';
    const index = req.query.index || 0;
    const imageUrl = await getEarthImageURL(date, variant, index);
    res.redirect(imageUrl);
  } catch (error) {
    console.error('Error getting Earth image URL:', error);
    res.status(500).json({ error: 'Failed to get Earth image URL', message: error.message });
  }
});

app.get('/earthnow/metadata', async (req, res) => {
  const date = req.query.date || 'latest';
  const variant = req.query.variant || 'natural';
  const index = req.query.index || 0;

  console.log(`Getting image for date ${date} and variant ${variant}`)

  // Include date and variant in cache key for specificity
  const cacheKey = `earthnow_metadata_${date}_${variant}`;
  let response = cache.get(cacheKey);

  if (!response) {
    // Fetch fresh data if not in cache
    response = await getEarthImageryMetadata(date, variant, index);
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

app.get('/satellites-above', async (req, res) => {
  try {
    // Default location: NYC
    let coords = convertDmsToDecimal(`40°41'34.4"N 73°58'54.2"W`);
    
    if (req.query.dms) {
      const dmsCoords = convertDmsToDecimal(req.query.dms);
      coords.latitude = dmsCoords.latitude;
      coords.longitude = dmsCoords.longitude;
      console.log("Using dms");
    } else if (req.query.lat && req.query.lon) {
      coords.latitude = parseFloat(req.query.lat);
      coords.longitude = parseFloat(req.query.lon);
      console.log("Using lat and lon");
    }
    console.log(coords);


    // Get coordinates from query params, or use defaults
    const latitude = coords.latitude;
    const longitude = coords.longitude;
    const altitude = req.query.alt || 0;
    const searchRadius = req.query.radius || 7;

    // Create a dynamic cache key based on location to avoid serving wrong data
    const cacheKey = `satellites_${latitude.toFixed(2)}_${longitude.toFixed(2)}_${searchRadius}`;
    const SATELLITE_CACHE_DURATION = 2 * 1000;

    let response = cache.get(cacheKey);
    
    if (!response) {
      console.log(`Cache miss for ${cacheKey}, fetching fresh satellite data.`);
      // Fetch fresh satellite data
      response = await satellitesAbove(latitude, longitude, altitude, searchRadius);
      // Cache the response with a 5-minute duration
      if (!response.error) {
        cache.set(cacheKey, response, SATELLITE_CACHE_DURATION);
        response.info = {
          ...response.info,
          latitude, longitude, altitude, searchRadius
        }
      } else { // If there was an error, still include the request info
        response.info = {
          latitude, longitude, altitude, searchRadius
        };
      }
    }
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching satellites:', error);
    // Avoid caching errors
    res.status(500).json({
      error: 'Failed to fetch satellite data',
      message: error.message
    });
  }
});

app.get('/dmstodecimals', (req, res) => {
  const dmsString = req.query.dms;
  if (!dmsString) {
    return res.status(400).json({ error: 'Missing dms query parameter' });
  }
  const decimalCoords = convertDmsToDecimal(dmsString);
  res.json(decimalCoords);
})

// Add a cache status endpoint for debugging
app.get('/cache/status', (req, res) => {
  res.json(cache.getStatus());
});

// Force refresh endpoint - clear specific cache entry or all cache
app.post('/cache/refresh', (req, res) => {
  const { key } = req.body;
  
  try {
    if (key) {
      cache.refresh(key);
      res.json({ message: `Cache refresh initiated for ${key}` });
    } else {
      cache.refreshAll();
      res.json({ message: 'All cache entries are being refreshed' });
    }
  } catch (error) {
    console.log('Force refreshed all cache entries');
    res.status(400).json({ message: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
