import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cache from './cache.js';

dotenv.config();

const API_BASE_URL = 'https://helioviewer-api.ias.u-psud.fr/v2';

// Default data sources for different sun images
// Using popular SDO AIA wavelengths for different solar phenomena
const DEFAULT_SOURCES = {
  171: 10, // AIA 171 - Quiet corona and coronal holes
  193: 11, // AIA 193 - Corona and hot flare plasma
  211: 12, // AIA 211 - Active regions
  304: 13, // AIA 304 - Chromosphere and transition region
  335: 14, // AIA 335 - Active regions
  94: 8, // AIA 94 - Flaring regions
  131: 9, // AIA 131 - Flaring regions
  1600: 15, // AIA 1600 - Transition region
  1700: 16, // AIA 1700 - Temperature minimum and photosphere
  4500: 17, // AIA 4500 - Photosphere
  continuum: 18, // HMI Continuum
  magnetogram: 19, // HMI Magnetogram
};

// Helper function to get current date in ISO format
const getCurrentISODate = () => {
  return new Date().toISOString();
};

// Helper function to format date to Helioviewer API format
const formatDateForHelioviewer = (date) => {
  if (date === 'latest') {
    return new Date().toISOString();
  }

  let dateObj;
  if (typeof date === 'string') {
    // Handle different date formats
    if (date.includes('T')) {
      // Already in ISO format
      dateObj = new Date(date);
    } else if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // YYYY-MM-DD format, add time component
      dateObj = new Date(date + 'T12:00:00.000Z');
    } else {
      // Try to parse as-is
      dateObj = new Date(date);
    }
  } else {
    dateObj = new Date(date);
  }

  if (isNaN(dateObj.getTime())) {
    throw new Error(
      `Invalid date: ${date}. Please use format YYYY-MM-DD or ISO format.`,
    );
  }

  return dateObj.toISOString();
};

// Helper function to find the most recent available image before the requested date
const findMostRecentAvailableImage = async (
  requestedDate,
  sourceId,
  maxDaysBack = 30,
) => {
  const requested = new Date(requestedDate);

  for (let i = 0; i < maxDaysBack; i++) {
    const checkDate = new Date(requested);
    checkDate.setDate(checkDate.getDate() - i);
    const dateString = checkDate.toISOString();

    try {
      const url = `${API_BASE_URL}/getClosestImage/?date=${dateString}&sourceId=${sourceId}`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        if (data && data.id && !data.error) {
          console.log(`Found sun image for date: ${dateString.split('T')[0]}`);
          return data;
        }
      }
    } catch (error) {
      console.log(`No sun image found for date: ${dateString.split('T')[0]}`);
      continue;
    }
  }

  // If no images found in the last 30 days, try with current date
  console.log('No images found in the last 30 days, trying current date');
  const currentDate = getCurrentISODate();
  const url = `${API_BASE_URL}/getClosestImage/?date=${currentDate}&sourceId=${sourceId}`;
  const response = await fetch(url);

  if (response.ok) {
    const data = await response.json();
    return data && data.id && !data.error ? data : null;
  }
  return null;
};

export const getSunImageMetadata = async (
  date = 'latest',
  wavelength = '171',
) => {
  try {
    console.log(`~~~~~~~~~~~~ Date is ${date}, wavelength is ${wavelength}`);

    // Get sourceId for the requested wavelength
    const sourceId = DEFAULT_SOURCES[wavelength];
    if (!sourceId) {
      throw new Error(
        `Unsupported wavelength: ${wavelength}. Available options: ${Object.keys(DEFAULT_SOURCES).join(', ')}`,
      );
    }

    const targetDate = formatDateForHelioviewer(date);

    console.log(
      `~~~~~~~~~~~~ Target date is ${targetDate}, sourceId is ${sourceId}`,
    );

    // Try to get the closest image to the requested date
    let url = `${API_BASE_URL}/getClosestImage/?date=${targetDate}&sourceId=${sourceId}`;
    console.log(`~~~~~~~~~~~~ URL is ${url}`);

    let response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Helioviewer API error: ${response.status} ${response.statusText}`,
      );
    }

    let data = await response.json();

    // Check if the response contains an error
    if (data.error) {
      throw new Error(`Helioviewer API error: ${data.error}`);
    }

    // If no image found for the requested date, find the most recent available
    if (!data || !data.id) {
      console.log(
        `No sun image found for requested date ${targetDate}, searching for most recent available...`,
      );
      data = await findMostRecentAvailableImage(targetDate, sourceId);
    }

    if (data && data.id) {
      // Add direct image URL for downloading the JPEG2000 image
      // Format the date to ISO format required by Helioviewer's getJP2Image endpoint
      const formattedDate = new Date(data.date).toISOString();
      data.jp2Url = `${API_BASE_URL}/getJP2Image/?date=${formattedDate}&sourceId=${sourceId}`;
      data.wavelength = wavelength;
      data.sourceId = sourceId;
    }

    return data;
  } catch (error) {
    console.error('Error fetching sun image metadata:', error);
    throw error;
  }
};

export const getSunImageUrl = async (date = 'latest', wavelength = '171') => {
  const metadata = await getSunImageMetadata(date, wavelength);
  if (!metadata || !metadata.jp2Url) {
    throw new Error('Unable to get sun image URL');
  }
  return metadata.jp2Url;
};

export const getSunImage = async (date = 'latest', wavelength = '171') => {
  const imageUrl = await getSunImageUrl(date, wavelength);
  console.log(`Fetching sun image from: ${imageUrl}`);

  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(
      `Failed to fetch sun image: ${imageResponse.status} ${imageResponse.statusText}`,
    );
  }

  // Check content type to ensure we got an image
  const contentType = imageResponse.headers.get('content-type');
  if (
    !contentType ||
    (!contentType.includes('image') &&
      !contentType.includes('application/octet-stream'))
  ) {
    throw new Error(
      `Invalid response type: ${contentType}. Expected image data.`,
    );
  }

  const imageBuffer = await imageResponse.arrayBuffer();
  return imageBuffer;
};

// Take a custom screenshot of the sun with specified parameters.
// Returns { imageBuffer, observationDate } so callers know the actual image time.
export const getSunScreenshot = async (
  date = 'latest',
  wavelength = '171',
  width = 1024,
  height = 1024,
  imageScale = 2.4204409,
) => {
  try {
    const sourceId = DEFAULT_SOURCES[wavelength];
    if (!sourceId) {
      throw new Error(`Unsupported wavelength: ${wavelength}`);
    }

    const targetDate = formatDateForHelioviewer(date);

    // Query getClosestImage first to learn the actual observation date
    let observationDate = null;
    try {
      const metaUrl = `${API_BASE_URL}/getClosestImage/?date=${targetDate}&sourceId=${sourceId}`;
      const metaRes = await fetch(metaUrl);
      if (metaRes.ok) {
        const meta = await metaRes.json();
        if (meta && meta.date) {
          // meta.date is like "2026-03-06 00:32:45"
          observationDate = meta.date.replace(' ', 'T') + 'Z';
        }
      }
    } catch (e) {
      console.warn('Could not fetch image observation date:', e.message);
    }

    const layers = `[${sourceId},1,100]`; // [sourceId, visible, opacity]

    const url = `${API_BASE_URL}/takeScreenshot/?date=${targetDate}&imageScale=${imageScale}&layers=${encodeURIComponent(layers)}&width=${width}&height=${height}&x0=0&y0=0&display=true`;

    console.log(`Taking sun screenshot from: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to take sun screenshot: ${response.status} ${response.statusText}`,
      );
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('image/png')) {
      const errorText = await response.text();
      throw new Error(`Screenshot API error: ${errorText}`);
    }

    const imageBuffer = await response.arrayBuffer();
    return { imageBuffer, observationDate };
  } catch (error) {
    console.error('Error taking sun screenshot:', error);
    throw error;
  }
};

// Get available data sources
export const getSunDataSources = async () => {
  try {
    const url = `${API_BASE_URL}/getDataSources/`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch data sources: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching sun data sources:', error);
    throw error;
  }
};

// Cached wrapper functions
export const getSunImageMetadataCached = async (
  date = 'latest',
  wavelength = '171',
) => {
  const cacheKey = `sun_metadata_${date}_${wavelength}`;
  let response = cache.get(cacheKey);

  if (!response) {
    response = await getSunImageMetadata(date, wavelength);
    cache.set(cacheKey, response);
  }

  return response;
};

export const getSunScreenshotCached = async (wavelength = '193', width = 1024, height = 1024, date = null) => {
  const dateKey = date || 'latest';
  const key = `sun_screenshot_${wavelength}_${width}x${height}_${dateKey}`;
  let data = cache.get(key);
  if (!data) {
    data = await getSunScreenshot(dateKey, wavelength, width, height);
    // Historical dates can be cached longer since they don't change
    const ttl = date ? 60 * 60 * 1000 : 10 * 60 * 1000; // 1 hour for historical, 10 min for live
    cache.set(key, data, ttl);
  }
  return data; // { imageBuffer, observationDate }
};

export const getSunDataSourcesCached = async () => {
  const cacheKey = 'sun_data_sources';
  let response = cache.get(cacheKey);

  if (!response) {
    response = await getSunDataSources();
    // Cache for longer since data sources don't change frequently
    cache.set(cacheKey, response, 86400); // 24 hours
  }

  return response;
};

// Helper function to list available wavelengths
export const getAvailableWavelengths = () => {
  return Object.keys(DEFAULT_SOURCES);
};

// --- Solar Regions (SWPC solar_regions.json) ---

const SWPC_REGIONS_URL = 'https://services.swpc.noaa.gov/json/solar_regions.json';

function parseLocation(locationStr) {
  if (!locationStr) return { lat: null, lon: null };
  const m = locationStr.match(/^([NS])([\d.]+)([EW])([\d.]+)$/i);
  if (!m) return { lat: null, lon: null };
  const lat = (m[1].toUpperCase() === 'N' ? 1 : -1) * parseFloat(m[2]);
  const lon = (m[3].toUpperCase() === 'E' ? 1 : -1) * parseFloat(m[4]);
  return { lat, lon };
}

export const fetchSolarRegions = async (targetDatetime = null) => {
  const response = await fetch(SWPC_REGIONS_URL);
  if (!response.ok) {
    throw new Error(`SWPC solar_regions fetch failed: ${response.status}`);
  }
  const raw = await response.json();

  // Extract just the date part for filtering (YYYY-MM-DD)
  const targetDate = targetDatetime ? targetDatetime.split('T')[0] : null;

  // If a specific date is requested, filter to that date.
  // Otherwise, return the most recent data available.
  let entries;
  if (targetDate) {
    entries = raw.filter((r) => r.observed_date === targetDate);
    // Fall back to closest earlier date if exact date not found
    if (entries.length === 0) {
      const allDates = [...new Set(raw.map((r) => r.observed_date))].sort();
      const fallbackDate = allDates.reverse().find((d) => d <= targetDate) || allDates[0];
      entries = raw.filter((r) => r.observed_date === fallbackDate);
    }
  } else {
    // Default: most recent date
    const allDates = [...new Set(raw.map((r) => r.observed_date))].sort();
    const latestDate = allDates[allDates.length - 1];
    entries = raw.filter((r) => r.observed_date === latestDate);
  }

  const seen = new Map();
  for (const r of entries) {
    const key = r.region;
    if (!seen.has(key) || r.observed_date > seen.get(key).observed_date) {
      seen.set(key, r);
    }
  }

  // If we have an exact target time, we can calculate how much the sun has rotated
  // between the observation time (00:00 UTC) and the image time, to align the markers perfectly!
  const targetTimeMs = targetDatetime && targetDatetime.includes('T') ? new Date(targetDatetime).getTime() : null;

  const regions = Array.from(seen.values()).map((r) => {
    const parsed = parseLocation(r.location);
    const lat = r.latitude ?? parsed.lat;
    let lon = r.longitude ?? parsed.lon;

    // Apply solar rotation interpolation
    if (targetTimeMs && r.observed_date && lat !== null && lon !== null) {
      const obsTimeMs = new Date(r.observed_date + 'T00:00:00Z').getTime();
      const diffHours = (targetTimeMs - obsTimeMs) / (1000 * 60 * 60);

      // Solar synodic rotation approx 13.2 deg/day.
      // Exact calculation using differential rotation:
      // omega_synodic = 14.713 - 2.396 * sin^2(lat) - 1.787 * sin^4(lat) - 0.9856
      const latRad = (lat * Math.PI) / 180;
      const sin2 = Math.pow(Math.sin(latRad), 2);
      const synodicDegPerDay = 14.713 - 2.396 * sin2 - 1.787 * sin2 * sin2 - 0.9856;
      const degPerHour = synodicDegPerDay / 24;

      // Westward is negative longitude, so subtract the rotation amount
      lon = lon - (degPerHour * diffHours);
    }

    return {
      region: r.region,
      latitude: lat,
      longitude: lon,
      location: r.location || null,
      area: r.area ?? null,
      numSpots: r.number_spots ?? null,
      magClass: r.mag_class || null,
      spotClass: r.spot_class || null,
      flareProbability: {
        c: r.c_flare_probability ?? 0,
        m: r.m_flare_probability ?? 0,
        x: r.x_flare_probability ?? 0,
      },
      observedDate: r.observed_date || null,
    };
  });
  return { regions, fetchedAt: new Date().toISOString(), observedDate: entries[0]?.observed_date || targetDate };
};

export const getSolarRegionsCached = async (targetDate = null) => {
  const dateKey = targetDate || 'latest';
  const key = `sun_regions_${dateKey}`;
  let data = cache.get(key);
  if (!data) {
    data = await fetchSolarRegions(targetDate);
    cache.set(key, data, 30 * 60 * 1000); // 30 minutes
  }
  return data;
};

// --- Solar Events (SWPC edited_events.json) ---

const SWPC_EVENTS_URL = 'https://services.swpc.noaa.gov/json/edited_events.json';

const EVENT_TYPE_NAMES = {
  EPL: 'Eruptive Prominence',
  DSF: 'Filament Disappearance',
  FIL: 'Filament',
};

export const fetchSolarEvents = async (types = ['EPL', 'DSF', 'FIL']) => {
  const response = await fetch(SWPC_EVENTS_URL);
  if (!response.ok) {
    throw new Error(`SWPC edited_events fetch failed: ${response.status}`);
  }
  const raw = await response.json();
  const typeSet = new Set(types.map((t) => t.toUpperCase()));

  // Only include events from the last 48 hours — older events are unreliable
  // because the sun rotates ~13.2°/day, making old coordinates inaccurate.
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const events = raw
    .filter((e) => {
      if (!typeSet.has((e.type || '').toUpperCase())) return false;
      if (!e.location) return false;
      // Filter out old events
      const beginTime = e.begin_datetime
        ? e.begin_datetime + (e.begin_datetime.endsWith('Z') ? '' : 'Z')
        : null;
      if (beginTime && beginTime < cutoff) return false;
      return true;
    })
    .map((e) => {
      const parsed = parseLocation(e.location);
      // Convert "2026-03-06T14:22:00" → ISO 8601
      const beginTime = e.begin_datetime
        ? new Date(e.begin_datetime + (e.begin_datetime.endsWith('Z') ? '' : 'Z')).toISOString()
        : null;
      return {
        type: (e.type || '').toUpperCase(),
        typeName: EVENT_TYPE_NAMES[(e.type || '').toUpperCase()] || e.type,
        beginTime,
        latitude: parsed.lat,
        longitude: parsed.lon,
        location: e.location,
      };
    });
  return { events, fetchedAt: new Date().toISOString() };
};

export const getSolarEventsCached = async (types = ['EPL', 'DSF', 'FIL']) => {
  const key = `sun_events_${types.slice().sort().join(',')}`;
  let data = cache.get(key);
  if (!data) {
    data = await fetchSolarEvents(types);
    cache.set(key, data, 15 * 60 * 1000); // 15 minutes
  }
  return data;
};

// Helper function to get wavelength description
export const getWavelengthDescription = (wavelength) => {
  const descriptions = {
    171: 'Quiet corona and coronal holes (171 Å)',
    193: 'Corona and hot flare plasma (193 Å)',
    211: 'Active regions (211 Å)',
    304: 'Chromosphere and transition region (304 Å)',
    335: 'Active regions (335 Å)',
    94: 'Flaring regions (94 Å)',
    131: 'Flaring regions (131 Å)',
    1600: 'Transition region (1600 Å)',
    1700: 'Temperature minimum and photosphere (1700 Å)',
    4500: 'Photosphere (4500 Å)',
    continuum: 'HMI Continuum - Photosphere',
    magnetogram: 'HMI Magnetogram - Magnetic field',
  };

  return descriptions[wavelength] || `Unknown wavelength: ${wavelength}`;
};
