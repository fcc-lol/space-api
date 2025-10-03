import express from 'express';
import {fetchDataCached} from './modules/spaceWeather.js';
import {getEarthImageURL, getEarthImage, getEarthImageryMetadataCached, getEarthImageryListCached} from './modules/earthNow.js';
import {satellitesAboveCached, satellitePositionsCached} from './modules/satellites.js';
import {convertDmsToDecimal} from './modules/coordinates.js';
import {getNeoFeedCached} from './modules/nearEarthObjects.js';
import {getUpcomingLaunchesCached, getUpcomingEventsCached, getLauncherConfigurationsCached} from './modules/spaceFlight.js';
import cache from './modules/cache.js';
import setupLog from './setup-log.json' with { type: 'json' };
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3102;

// How often (in seconds) to fetch fresh satellite data to avoid N2YO rate limits.
const SATELLITE_DATA_FETCH_INTERVAL_SECONDS = 60;

// Middleware to parse JSON bodies
app.use(express.json());

// Enable CORS for all routes and origins
app.use(cors());

// Register refresh functions with the cache
cache.registerRefreshFunction('solarflares', () => fetchDataCached('solarFlares'));
cache.registerRefreshFunction('sep', () => fetchDataCached('SEP'));
cache.registerRefreshFunction('cmes', () => fetchDataCached('CMEs'));
cache.registerRefreshFunction('neos', () => getNeoFeedCached());
cache.registerRefreshFunction('launches', () => getUpcomingLaunchesCached());
cache.registerRefreshFunction('events', () => getUpcomingEventsCached());
cache.registerRefreshFunction('launchVehicles', () => getLauncherConfigurationsCached());
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
  
  const response = await fetchDataCached('solarFlares', req.query.startDate || null, req.query.endDate || null);
  res.json(response);
})

app.get('/sep', async (req, res) => {
  console.log("Getting SEPs")
  
  const response = await fetchDataCached('SEP', req.query.startDate || null, req.query.endDate || null);
  res.json(response);
});

app.get('/cmes', async (req, res) => {
  console.log("Getting coronal mass ejections")
  
  const response = await fetchDataCached('CMEs', req.query.startDate || null, req.query.endDate || null);
  res.json(response);
});

app.get('/earthnow/list', async (req, res) => {
  try {
    const date = req.query.date || 'latest';
    const variant = req.query.variant || 'natural';

    const response = await getEarthImageryListCached(date, variant);
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

  const response = await getEarthImageryMetadataCached(date, variant, index);
  res.json(response);
});

app.get('/neos', async (req, res) => {
  const response = await getNeoFeedCached();
  res.json(response);
});

app.get('/satellites-above', async (req, res) => {
  console.log("Getting satellites above");
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

    // Fetch satellite data with caching handled in the module
    const response = await satellitesAboveCached(latitude, longitude, altitude, searchRadius);
    
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

app.get("/satellite-positions", async (req, res) => {
  console.log("Getting satellite positions");
  try {
    let coords = convertDmsToDecimal(`40°41'34.4"N 73°58'54.2"W`);
    const latitude = coords.latitude;
    const longitude = coords.longitude;

    const satId = req.query.satid;
    
    // Fetch satellite positions with caching handled in the module
    const response = await satellitePositionsCached(latitude, longitude, satId, SATELLITE_DATA_FETCH_INTERVAL_SECONDS);

    res.json(response);

  } catch (error) {
    console.error('Error in /satellite-positions:', error);
    res.status(500).json({ error: 'Failed to get satellite positions', message: error.message });
  }
});

app.get('/spaceflight/launches', async (req, res) => {
  console.log("Getting upcoming launches");
  
  const response = await getUpcomingLaunchesCached();
  res.json(response);
});

app.get('/spaceflight/next-launch', async (req, res) => {
  console.log("Getting next launch");
  
  const launches = await getUpcomingLaunchesCached();
  const nextLaunch = launches.results[0];
  res.json(nextLaunch);
});

app.get('/spaceflight/events', async (req, res) => {
  console.log("Getting upcoming events");
  
  const response = await getUpcomingEventsCached();
  res.json(response);
});

app.get('/spaceflight/launcher-configurations', async (req, res) => {
  console.log("Getting launch vehicles");
  
  const search = req.query.search;
  const response = await getLauncherConfigurationsCached(search);
  res.json(response);
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
