import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import cache from './cache.js';
import { convertDmsToDecimal } from './coordinates.js';

// Default to NYC coordinates
const DEFAULT_COORDS = convertDmsToDecimal(`40°41'34.4"N 73°58'54.2"W`);

/**
 * Helper function to convert 24-hour time to 12-hour format
 */
function convertTo12Hour(time24) {
  if (!time24 || time24 === '----') return time24;

  // Parse the time string (format: HH:MM or H:MM)
  const match = time24.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return time24;

  let hours = parseInt(match[1], 10);
  const minutes = match[2];

  const period = hours >= 12 ? 'PM' : 'AM';

  // Convert to 12-hour format
  if (hours === 0) {
    hours = 12;
  } else if (hours > 12) {
    hours = hours - 12;
  }

  return `${hours}:${minutes} ${period}`;
}

/**
 * Parse USNO HTML response to extract moon data
 */
function parseUSNOHTML(html) {
  const $ = cheerio.load(html);

  const moonData = {
    rise: null,
    upperTransit: null,
    set: null,
    phase: null,
    illumination: null,
  };

  // Get all text content for easier parsing
  const bodyText = $('body').text();

  // Find all tables
  const tables = $('table');

  tables.each((i, table) => {
    const rows = $(table).find('tr');
    let inMoonSection = false;

    rows.each((j, row) => {
      const cells = $(row).find('td, th');

      // Check all cells to find section headers
      if (cells.length === 1) {
        const headerText = $(cells[0]).text().trim();

        if (headerText === 'Moon') {
          inMoonSection = true;
          return; // continue
        } else if (headerText === 'Sun') {
          inMoonSection = false;
        }
      }

      // Parse moon data when we're in the Moon section
      if (inMoonSection && cells.length === 2) {
        const label = $(cells[0]).text().trim();
        const value = $(cells[1]).text().trim();

        if (label === 'Rise' && value) {
          moonData.rise = convertTo12Hour(value);
        } else if (label === 'Upper Transit' && value) {
          moonData.upperTransit = convertTo12Hour(value);
        } else if (label === 'Set' && value) {
          moonData.set = convertTo12Hour(value);
        }
      }
    });
  });

  // Extract phase name (e.g., "Waning Gibbous")
  const phaseMatch = bodyText.match(
    /Phase of the moon[^:]*:\s*([^\s]+(?:\s+[^\s]+)*?)\s+with/i,
  );
  if (phaseMatch) {
    moonData.phase = phaseMatch[1].trim();
  }

  // Extract illumination percentage
  const illumMatch = bodyText.match(
    /(\d+)%\s+of the Moon'?s visible disk illuminated/i,
  );
  if (illumMatch) {
    moonData.illumination = parseInt(illumMatch[1]);
  }

  // Extract primary phase information
  const primaryPhaseMatch = bodyText.match(
    /Closest Primary Moon Phase:\s*([^\n]+)/i,
  );
  if (primaryPhaseMatch) {
    moonData.primaryPhase = primaryPhaseMatch[1].trim();
  }

  return moonData;
}

/**
 * Fetch NASA Dial-a-Moon data
 */
async function fetchNASAMoonData(isoTime) {
  const nasaUrl = `https://svs.gsfc.nasa.gov/api/dialamoon/${isoTime}`;
  const proxyUrl = `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(
    nasaUrl,
  )}`;

  const response = await fetch(proxyUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch NASA moon data via proxy: ${response.status} ${response.statusText}`,
    );
  }

  return await response.json();
}

/**
 * Fetch USNO moon data
 */
async function fetchUSNOMoonData(dateStr, lat, lon) {
  // EST is UTC-5, EDT is UTC-4 - using EST as default
  const tzOffset = -5;
  const tzSign = tzOffset < 0 ? -1 : 1;
  const tzAbs = Math.abs(tzOffset);

  const params = new URLSearchParams({
    date: dateStr,
    lat: lat.toFixed(4),
    lon: lon.toFixed(4),
    label: '',
    tz: tzAbs.toFixed(2),
    tz_sign: tzSign,
    tz_label: 'false',
    dst: 'false',
  });

  const url = `https://aa.usno.navy.mil/calculated/rstt/oneday?${params.toString()}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch USNO moon data: ${response.status} ${response.statusText}`,
    );
  }

  const html = await response.text();
  return parseUSNOHTML(html);
}

/**
 * Get combined moon data from NASA and USNO sources
 */
async function getMoonData(lat = null, lon = null) {
  // Use provided coordinates or default to NYC
  const latitude = lat !== null ? lat : DEFAULT_COORDS.latitude;
  const longitude = lon !== null ? lon : DEFAULT_COORDS.longitude;

  // Get current time in NYC timezone
  const now = new Date();
  const nycTime = new Date(
    now.toLocaleString('en-US', { timeZone: 'America/New_York' }),
  );

  // Format: YYYY-MM-DDTHH:MM
  const year = nycTime.getFullYear();
  const month = String(nycTime.getMonth() + 1).padStart(2, '0');
  const day = String(nycTime.getDate()).padStart(2, '0');
  const hours = String(nycTime.getHours()).padStart(2, '0');
  const minutes = String(nycTime.getMinutes()).padStart(2, '0');
  const isoTime = `${year}-${month}-${day}T${hours}:${minutes}`;
  const dateStr = `${year}-${month}-${day}`;

  try {
    // Fetch both data sources in parallel
    const [nasaMoonData, usnoData] = await Promise.all([
      fetchNASAMoonData(isoTime),
      fetchUSNOMoonData(dateStr, latitude, longitude),
    ]);

    // Combine both data sources into a semantic structure
    return {
      // Phase information (from both sources)
      phase: {
        percent: nasaMoonData.phase,
        name: usnoData.phase,
        illumination: usnoData.illumination,
        illuminationUnit: '%',
        age: nasaMoonData.age,
        ageUnit: 'days',
      },
      // Rise, set, and transit times
      times: {
        rise: usnoData.rise,
        set: usnoData.set,
        upperTransit: usnoData.upperTransit,
      },
      // Position and distance
      position: {
        distance: nasaMoonData.distance,
        distanceUnit: 'km',
        diameter: nasaMoonData.diameter,
        diameterUnit: 'arcseconds',
        j2000_ra: nasaMoonData.j2000_ra,
        j2000_dec: nasaMoonData.j2000_dec,
        subsolar_lon: nasaMoonData.subsolar_lon,
        subsolar_lat: nasaMoonData.subsolar_lat,
        subearth_lon: nasaMoonData.subearth_lon,
        subearth_lat: nasaMoonData.subearth_lat,
        posangle: nasaMoonData.posangle,
        angleUnit: 'degrees',
      },
      // Images
      images: {
        standard: nasaMoonData.image,
        highres: nasaMoonData.image_highres,
        south_up: nasaMoonData.su_image,
        south_up_highres: nasaMoonData.su_image_highres,
      },
      // Additional information
      nextPhase: usnoData.primaryPhase,
      obscuration: nasaMoonData.obscuration,
      obscurationUnit: '%',
      // Metadata
      location: {
        latitude,
        longitude,
      },
      timestamp: now.toISOString(),
      time: isoTime,
    };
  } catch (error) {
    console.error('Error fetching moon data:', error);
    throw error;
  }
}

/**
 * Get cached moon data
 */
export async function getMoonDataCached(lat = null, lon = null) {
  // Create a cache key that includes coordinates and rounds to 15-minute intervals
  const now = new Date();
  const roundedMinutes = Math.floor(now.getMinutes() / 15) * 15;
  const cacheTime = new Date(now);
  cacheTime.setMinutes(roundedMinutes, 0, 0);

  const latitude = lat !== null ? lat : DEFAULT_COORDS.latitude;
  const longitude = lon !== null ? lon : DEFAULT_COORDS.longitude;

  const cacheKey = `moon_${latitude.toFixed(4)}_${longitude.toFixed(
    4,
  )}_${cacheTime.getTime()}`;

  let response = cache.get(cacheKey);

  if (!response) {
    response = await getMoonData(latitude, longitude);
    cache.set(cacheKey, response, 15 * 60 * 1000); // Cache for 15 minutes
  }

  return response;
}

/**
 * Get just NASA moon data (without USNO)
 */
export async function getNASAMoonDataCached() {
  // Get current time in NYC timezone
  const now = new Date();
  const nycTime = new Date(
    now.toLocaleString('en-US', { timeZone: 'America/New_York' }),
  );

  // Format: YYYY-MM-DDTHH:MM
  const year = nycTime.getFullYear();
  const month = String(nycTime.getMonth() + 1).padStart(2, '0');
  const day = String(nycTime.getDate()).padStart(2, '0');
  const hours = String(nycTime.getHours()).padStart(2, '0');
  const minutes = String(nycTime.getMinutes()).padStart(2, '0');
  const isoTime = `${year}-${month}-${day}T${hours}:${minutes}`;

  // Round to 15-minute intervals for caching
  const roundedMinutes = Math.floor(now.getMinutes() / 15) * 15;
  const cacheTime = new Date(now);
  cacheTime.setMinutes(roundedMinutes, 0, 0);
  const cacheKey = `nasa_moon_${cacheTime.getTime()}`;

  let response = cache.get(cacheKey);

  if (!response) {
    response = await fetchNASAMoonData(isoTime);
    cache.set(cacheKey, response, 15 * 60 * 1000); // Cache for 15 minutes
  }

  return response;
}

/**
 * Get just USNO moon data (without NASA)
 */
export async function getUSNOMoonDataCached(lat = null, lon = null) {
  const latitude = lat !== null ? lat : DEFAULT_COORDS.latitude;
  const longitude = lon !== null ? lon : DEFAULT_COORDS.longitude;

  const now = new Date();
  const nycTime = new Date(
    now.toLocaleString('en-US', { timeZone: 'America/New_York' }),
  );

  const year = nycTime.getFullYear();
  const month = String(nycTime.getMonth() + 1).padStart(2, '0');
  const day = String(nycTime.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  // Round to daily caching since USNO data is day-specific
  const cacheKey = `usno_moon_${dateStr}_${latitude.toFixed(
    4,
  )}_${longitude.toFixed(4)}`;

  let response = cache.get(cacheKey);

  if (!response) {
    response = await fetchUSNOMoonData(dateStr, latitude, longitude);
    cache.set(cacheKey, response, 60 * 60 * 1000); // Cache for 1 hour
  }

  return response;
}
