import express from 'express';
import { fetchDataCached } from './modules/spaceWeather.js';
import {
  getEarthImageURL,
  getEarthImage,
  getEarthImageryMetadataCached,
  getEarthImageryListCached,
} from './modules/earthNow.js';
import {
  getSunImageMetadata,
  getSunImageUrl,
  getSunImage,
  getSunScreenshot,
  getSunDataSources,
  getSunImageMetadataCached,
  getSunDataSourcesCached,
  getAvailableWavelengths,
  getWavelengthDescription,
} from './modules/sunImages.js';
import {
  satellitesAboveCached,
  satellitePositionsCached,
} from './modules/satellites.js';
import { convertDmsToDecimal } from './modules/coordinates.js';
import { getNeoFeedCached } from './modules/nearEarthObjects.js';
import {
  getUpcomingLaunchesCached,
  getUpcomingEventsCached,
  getLauncherConfigurationsCached,
} from './modules/spaceFlight.js';
import { getMoonDataCached } from './modules/moonData.js';
import cache from './modules/cache.js';
import setupLog from './setup-log.json' with { type: 'json' };
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 3102;

// How often (in seconds) to fetch fresh satellite data to avoid N2YO rate limits.
const SATELLITE_DATA_FETCH_INTERVAL_SECONDS = 2 * 60;

// Activity tracking
const activityLog = [];
const MAX_ACTIVITY_LOG_SIZE = 100;

// Middleware to parse JSON bodies
app.use(express.json());

// Enable CORS for all routes and origins
app.use(cors());

// Activity tracking middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function (data) {
    const duration = Date.now() - startTime;
    const activity = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      query: req.query,
      statusCode: res.statusCode,
      duration: duration,
      userAgent: req.get('User-Agent') || 'Unknown',
      ip: req.ip || req.connection.remoteAddress || 'Unknown',
    };

    // Add to activity log
    activityLog.unshift(activity);
    if (activityLog.length > MAX_ACTIVITY_LOG_SIZE) {
      activityLog.pop();
    }

    return originalSend.call(this, data);
  };

  next();
});

// Register refresh functions with the cache
cache.registerRefreshFunction('solarflares', () =>
  fetchDataCached('solarFlares'),
);
cache.registerRefreshFunction('sep', () => fetchDataCached('SEP'));
cache.registerRefreshFunction('cmes', () => fetchDataCached('CMEs'));
cache.registerRefreshFunction('neos', () => getNeoFeedCached());
cache.registerRefreshFunction('launches', () => getUpcomingLaunchesCached());
cache.registerRefreshFunction('events', () => getUpcomingEventsCached());
cache.registerRefreshFunction('launchVehicles', () =>
  getLauncherConfigurationsCached(),
);
// Note: We are not registering a global refresh function for satellites
// because its parameters (lat, lon) are request-specific.
// The cache for this endpoint will be populated on-demand by user requests.
setInterval(
  () => {
    cache.refreshAll(); // This will refresh solarflares, sep, cmes, neos
  },
  15 * 60 * 1000,
); // Refresh every 15 minutes

app.get('/', (req, res) => {
  res.send('space-api');
});

// Serve the status page
app.get('/status-page', (req, res) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const filePath = path.join(__dirname, 'status-page.html');
  res.sendFile(filePath);
});

app.get('/solarflares', async (req, res) => {
  console.log('Getting solar flares');

  const response = await fetchDataCached(
    'solarFlares',
    req.query.startDate || null,
    req.query.endDate || null,
  );
  res.json(response);
});

app.get('/sep', async (req, res) => {
  console.log('Getting SEPs');

  const response = await fetchDataCached(
    'SEP',
    req.query.startDate || null,
    req.query.endDate || null,
  );
  res.json(response);
});

app.get('/cmes', async (req, res) => {
  console.log('Getting coronal mass ejections');

  const response = await fetchDataCached(
    'CMEs',
    req.query.startDate || null,
    req.query.endDate || null,
  );
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
    res.status(500).json({
      error: 'Failed to fetch Earth imagery list',
      message: error.message,
    });
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
      message: error.message,
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
    res
      .status(500)
      .json({ error: 'Failed to get Earth image URL', message: error.message });
  }
});

app.get('/earthnow/metadata', async (req, res) => {
  const date = req.query.date || 'latest';
  const variant = req.query.variant || 'natural';
  const index = req.query.index || 0;

  console.log(`Getting image for date ${date} and variant ${variant}`);

  const response = await getEarthImageryMetadataCached(date, variant, index);
  res.json(response);
});

// Sun images routes
app.get('/sun/metadata', async (req, res) => {
  try {
    const date = req.query.date || 'latest';
    const wavelength = req.query.wavelength || '193';

    console.log(
      `Getting sun image metadata for date ${date} and wavelength ${wavelength}`,
    );

    const response = await getSunImageMetadataCached(date, wavelength);
    res.json(response);
  } catch (error) {
    console.error('Error fetching sun image metadata:', error);
    res.status(500).json({
      error: 'Failed to fetch sun image metadata',
      message: error.message,
    });
  }
});

app.get('/sun/imageurl', async (req, res) => {
  try {
    const date = req.query.date || 'latest';
    const wavelength = req.query.wavelength || '193';

    const response = await getSunImageUrl(date, wavelength);
    res.json({ url: response });
  } catch (error) {
    console.error('Error getting sun image URL:', error);
    res
      .status(500)
      .json({ error: 'Failed to get sun image URL', message: error.message });
  }
});

app.get('/sun/image', async (req, res) => {
  try {
    const date = req.query.date || 'latest';
    const wavelength = req.query.wavelength || '193';
    const width = parseInt(req.query.width) || 1024;
    const height = parseInt(req.query.height) || 1024;
    const imageScale = parseFloat(req.query.imageScale) || 2.4204409;

    console.log(
      `Taking sun screenshot for date ${date}, wavelength ${wavelength}, size ${width}x${height}`,
    );

    const screenshotBuffer = await getSunScreenshot(
      date,
      wavelength,
      width,
      height,
      imageScale,
    );

    res.set({
      'Content-Type': 'image/png',
      'Content-Length': screenshotBuffer.byteLength,
    });
    res.send(Buffer.from(screenshotBuffer));
  } catch (error) {
    console.error('Error taking sun screenshot:', error);
    res
      .status(500)
      .json({ error: 'Failed to take sun screenshot', message: error.message });
  }
});

app.get('/sun/datasources', async (req, res) => {
  try {
    console.log('Getting sun data sources');

    const response = await getSunDataSourcesCached();
    res.json(response);
  } catch (error) {
    console.error('Error fetching sun data sources:', error);
    res.status(500).json({
      error: 'Failed to fetch sun data sources',
      message: error.message,
    });
  }
});

app.get('/sun/wavelengths', (req, res) => {
  try {
    const wavelengths = getAvailableWavelengths();
    const wavelengthInfo = wavelengths.map((w) => ({
      wavelength: w,
      description: getWavelengthDescription(w),
    }));

    res.json({
      available_wavelengths: wavelengths,
      wavelength_info: wavelengthInfo,
    });
  } catch (error) {
    console.error('Error getting available wavelengths:', error);
    res.status(500).json({
      error: 'Failed to get available wavelengths',
      message: error.message,
    });
  }
});

app.get('/neos', async (req, res) => {
  const response = await getNeoFeedCached();
  res.json(response);
});

// Moon data endpoint
app.get('/moon', async (req, res) => {
  console.log('Getting moon data');
  try {
    // Get coordinates from query params or use NYC defaults
    const lat = req.query.lat ? parseFloat(req.query.lat) : null;
    const lon = req.query.lon ? parseFloat(req.query.lon) : null;

    const response = await getMoonDataCached(lat, lon);
    res.json(response);
  } catch (error) {
    console.error('Error fetching moon data:', error);
    res.status(500).json({
      error: 'Failed to fetch moon data',
      message: error.message,
    });
  }
});

let lastSatellitesAboveRequestTime = 0;

app.get('/satellites-above', async (req, res) => {
  console.log('Getting satellites above');
  try {
    // Default location: NYC
    let coords = convertDmsToDecimal(`40°41'34.4"N 73°58'54.2"W`);

    if (req.query.dms) {
      const dmsCoords = convertDmsToDecimal(req.query.dms);
      coords.latitude = dmsCoords.latitude;
      coords.longitude = dmsCoords.longitude;
      console.log('Using dms');
    } else if (req.query.lat && req.query.lon) {
      coords.latitude = parseFloat(req.query.lat);
      coords.longitude = parseFloat(req.query.lon);
      console.log('Using lat and lon');
    }
    console.log(coords);

    // Get coordinates from query params, or use defaults
    const latitude = coords.latitude;
    const longitude = coords.longitude;
    const altitude = req.query.alt || 0;
    const searchRadius = req.query.radius || 7;

    // Fetch satellite data with caching handled in the module
    const response = await satellitesAboveCached(
      latitude,
      longitude,
      altitude,
      searchRadius,
    );

    res.json(response);
  } catch (error) {
    console.error('Error fetching satellites:', error);
    // Avoid caching errors
    res.status(500).json({
      error: 'Failed to fetch satellite data',
      message: error.message,
    });
  }
});

app.get('/satellite-positions', async (req, res) => {
  console.log('Getting satellite positions');
  try {
    let coords = convertDmsToDecimal(`40°41'34.4"N 73°58'54.2"W`);
    const latitude = coords.latitude;
    const longitude = coords.longitude;

    const satId = req.query.satid;

    // Fetch satellite positions with caching handled in the module
    const response = await satellitePositionsCached(
      latitude,
      longitude,
      satId,
      SATELLITE_DATA_FETCH_INTERVAL_SECONDS,
    );

    res.json(response);
  } catch (error) {
    console.error('Error in /satellite-positions:', error);
    res.status(500).json({
      error: 'Failed to get satellite positions',
      message: error.message,
    });
  }
});

app.get('/spaceflight/launches', async (req, res) => {
  console.log('Getting upcoming launches');

  const response = await getUpcomingLaunchesCached();
  res.json(response);
});

app.get('/spaceflight/next-launch', async (req, res) => {
  console.log('Getting next launch');

  const launches = await getUpcomingLaunchesCached();
  const nextLaunch = launches.results[0];
  res.json(nextLaunch);
});

app.get('/spaceflight/events', async (req, res) => {
  console.log('Getting upcoming events');

  const response = await getUpcomingEventsCached();
  res.json(response);
});

app.get('/spaceflight/launcher-configurations', async (req, res) => {
  console.log('Getting launch vehicles');

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
});

// Add a cache status endpoint for debugging
app.get('/cache/status', (req, res) => {
  res.json(cache.getStatus());
});

// Fetch raw cache contents for a given key
app.get('/cache/item', (req, res) => {
  const key = req.query.key;
  if (!key) {
    return res.status(400).json({ error: 'Missing key query parameter' });
  }
  try {
    const info = cache.peek(key);
    if (!info.exists) {
      return res.status(404).json({ error: `No cache entry for key: ${key}` });
    }
    res.json({ key, ...info });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Failed to read cache entry', message: error.message });
  }
});

// Enhanced status endpoint with comprehensive information
app.get('/status', (req, res) => {
  const cacheStatus = cache.getStatus();
  const now = Date.now();

  // Define data sources and their characteristics
  const dataSources = {
    solarflares: {
      name: 'Solar Flares',
      description: 'NASA DONKI Solar Flare data',
      refreshInterval: '15 minutes',
      cacheDuration: '1 hour',
      apiSource: 'NASA DONKI API',
      endpoint: '/solarflares',
    },
    sep: {
      name: 'Solar Energetic Particles (SEP)',
      description: 'NASA DONKI SEP event data',
      refreshInterval: '15 minutes',
      cacheDuration: '1 hour',
      apiSource: 'NASA DONKI API',
      endpoint: '/sep',
    },
    cmes: {
      name: 'Coronal Mass Ejections (CMEs)',
      description: 'NASA DONKI CME data',
      refreshInterval: '15 minutes',
      cacheDuration: '1 hour',
      apiSource: 'NASA DONKI API',
      endpoint: '/cmes',
    },
    neos: {
      name: 'Near Earth Objects',
      description: 'NASA NEO feed data',
      refreshInterval: '15 minutes',
      cacheDuration: '1 hour',
      apiSource: 'NASA NEO API',
      endpoint: '/neos',
    },
    launches: {
      name: 'Upcoming Launches',
      description: 'Space flight launch data',
      refreshInterval: '15 minutes',
      cacheDuration: '2 hours',
      apiSource: 'The Space Devs API',
      endpoint: '/spaceflight/launches',
    },
    events: {
      name: 'Space Events',
      description: 'Upcoming space events',
      refreshInterval: '15 minutes',
      cacheDuration: '2 hours',
      apiSource: 'The Space Devs API',
      endpoint: '/spaceflight/events',
    },
    launchVehicles: {
      name: 'Launch Vehicles',
      description: 'Launch vehicle configurations',
      refreshInterval: '15 minutes',
      cacheDuration: '1 month',
      apiSource: 'The Space Devs API',
      endpoint: '/spaceflight/launcher-configurations',
    },
    sun_data_sources: {
      name: 'Sun Data Sources',
      description: 'Helioviewer API data sources',
      refreshInterval: 'On demand',
      cacheDuration: '24 hours',
      apiSource: 'Helioviewer API',
      endpoint: '/sun/datasources',
    },
    moon: {
      name: 'Moon Data',
      description: 'Moon imagery, phase, rise/set times, and illumination data',
      refreshInterval: 'On demand',
      cacheDuration: '15 minutes',
      apiSource: 'NASA Dial-a-Moon & US Naval Observatory',
      endpoint: '/moon',
    },
  };

  // Process cache status with additional information
  const processedCacheStatus = {};
  for (const [key, status] of Object.entries(cacheStatus)) {
    const sourceInfo = dataSources[key] || {
      name: key,
      description: 'Unknown data source',
      refreshInterval: 'Unknown',
      cacheDuration: 'Unknown',
      apiSource: 'Unknown',
      endpoint: 'Unknown',
    };

    processedCacheStatus[key] = {
      ...status,
      ...sourceInfo,
      lastUpdated: new Date(now - status.age * 1000).toISOString(),
      nextRefresh: new Date(now + status.timeUntilExpiry * 1000).toISOString(),
      status: status.isValid ? 'healthy' : 'expired',
    };
  }

  // Get server uptime
  const uptime = process.uptime();
  const uptimeHours = Math.floor(uptime / 3600);
  const uptimeMinutes = Math.floor((uptime % 3600) / 60);
  const uptimeSeconds = Math.floor(uptime % 60);

  // Calculate activity statistics
  const recentActivity = activityLog.slice(0, 20); // Last 20 requests
  const totalRequests = activityLog.length;
  const requestsLastHour = activityLog.filter(
    (a) => new Date(a.timestamp) > new Date(now - 60 * 60 * 1000),
  ).length;

  // Group requests by endpoint
  const endpointStats = {};
  activityLog.forEach((activity) => {
    const endpoint = activity.path;
    if (!endpointStats[endpoint]) {
      endpointStats[endpoint] = { count: 0, avgDuration: 0, lastRequest: null };
    }
    endpointStats[endpoint].count++;
    endpointStats[endpoint].avgDuration =
      (endpointStats[endpoint].avgDuration *
        (endpointStats[endpoint].count - 1) +
        activity.duration) /
      endpointStats[endpoint].count;
    if (
      !endpointStats[endpoint].lastRequest ||
      new Date(activity.timestamp) >
        new Date(endpointStats[endpoint].lastRequest)
    ) {
      endpointStats[endpoint].lastRequest = activity.timestamp;
    }
  });

  const status = {
    server: {
      status: 'online',
      uptime: `${uptimeHours}h ${uptimeMinutes}m ${uptimeSeconds}s`,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    },
    cache: {
      totalEntries: Object.keys(cacheStatus).length,
      healthyEntries: Object.values(cacheStatus).filter((s) => s.isValid)
        .length,
      expiredEntries: Object.values(cacheStatus).filter((s) => !s.isValid)
        .length,
      entries: processedCacheStatus,
    },
    activity: {
      totalRequests,
      requestsLastHour,
      recentActivity,
      endpointStats,
    },
    dataSources: dataSources,
    refreshSchedule: {
      nextRefresh: new Date(now + 15 * 60 * 1000).toISOString(),
      interval: '15 minutes',
    },
  };

  res.json(status);
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
