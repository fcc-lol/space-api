import express from 'express';
import {fetchData} from './modules/spaceWeather.js';
import {getEarthImageURL, getEarthImage, getEarthImageryMetadata} from './modules/earthNow.js';
import {satellitesAbove} from './modules/satellites.js';
import {convertDmsToDecimal} from './modules/coordinates.js';
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
    const image = await getEarthImage(req.query.date || 'latest', req.query.variant || 'natural', req.query.index || 0);
    res.set('Content-Type', 'image/png');
    res.send(Buffer.from(image));
  } catch (error) {
    console.error('Error serving Earth image:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Earth image', 
      message: error.message 
    });
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
    const searchRadius = req.query.radius || 5;

    // Create a dynamic cache key based on location to avoid serving wrong data
    const cacheKey = `satellites_${latitude.toFixed(2)}_${longitude.toFixed(2)}_${searchRadius}`;
    const SATELLITE_CACHE_DURATION = .5 * 60 * 1000; // 30 seconds in milliseconds

    let response = cache.get(cacheKey);
    
    if (!response) {
      console.log(`Cache miss for ${cacheKey}, fetching fresh satellite data.`);
      // Fetch fresh satellite data
      response = await satellitesAbove(latitude, longitude, altitude, searchRadius);
      // Cache the response with a 5-minute duration
      if (!response.error) {
        cache.set(cacheKey, response, SATELLITE_CACHE_DURATION);
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

app.get('/satellites-above-map', async (req, res) => {
  try {
    // Default location: NYC
    let coords = convertDmsToDecimal(`40°41'34.4"N 73°58'54.2"W`);
    
    if (req.query.dms) {
      const dmsCoords = convertDmsToDecimal(req.query.dms);
      coords.latitude = dmsCoords.latitude;
      coords.longitude = dmsCoords.longitude;
    } else if (req.query.lat && req.query.lon) {
      coords.latitude = parseFloat(req.query.lat);
      coords.longitude = parseFloat(req.query.lon);
    }

    const latitude = coords.latitude;
    const longitude = coords.longitude;
    const altitude = req.query.alt || 0;
    const searchRadius = req.query.radius || 5;

    // Use the same caching logic as /satellites-above
    const cacheKey = `satellites_${latitude.toFixed(2)}_${longitude.toFixed(2)}_${searchRadius}`;
    const SATELLITE_CACHE_DURATION = 0.5 * 60 * 1000; // 30 seconds

    let satelliteData = cache.get(cacheKey);
    
    if (!satelliteData) {
      satelliteData = await satellitesAbove(latitude, longitude, altitude, searchRadius);
      if (!satelliteData.error) {
        cache.set(cacheKey, satelliteData, SATELLITE_CACHE_DURATION);
      }
    }

    if (satelliteData.error || !satelliteData.above || satelliteData.above.length === 0) {
      return res.status(404).json({ message: 'No satellites found for the given location.', data: satelliteData });
    }

    // Construct the Google Maps URL to show pins, not directions.
    // The map will be centered on the observer's location.
    // The satellite locations will be part of the search query.
    const observerLocation = `${latitude},${longitude}`;
    const satellitePinsQuery = satelliteData.above.map(sat => `${sat.satlat},${sat.satlng}`).join('/');
    const mapUrl = `https://www.google.com/maps/search/${satellitePinsQuery}/@${observerLocation},8z`;

    res.json({ mapUrl });

  } catch (error) {
    console.error('Error generating satellite map URL:', error);
    res.status(500).json({ error: 'Failed to generate satellite map URL', message: error.message });
  }
});

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
