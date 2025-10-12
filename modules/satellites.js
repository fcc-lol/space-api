import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cache from './cache.js';

dotenv.config();

const API_URL = `https://api.n2yo.com/rest/v1/satellite/`;

// Deduplicate in-flight requests per cache key to avoid race conditions
const inFlightAboveRequests = new Map();

export const satellitesAbove = async (lat, lon, alt, radius) => {
  console.log('satellitesAbove');
  const url = `${API_URL}above/${lat}/${lon}/${alt}/${radius}/0/&apiKey=${process.env.N2YO_API_KEY}`;
  console.log(url);
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching satellites above:', error);
    throw error;
  }
};

export const satellitePositions = async (lat, lon, satId, seconds = 40) => {
  const url = `${API_URL}positions/${satId}/${lat}/${lon}/0/${seconds}/&apiKey=${process.env.N2YO_API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching satellite positions:', error);
    throw error;
  }
};

// Cached wrapper functions
export const satellitesAboveCached = async (lat, lon, alt, radius) => {
  // Create a dynamic cache key based on location to avoid serving wrong data
  const cacheKey = `satellites_${lat.toFixed(2)}_${lon.toFixed(2)}_${radius}`;
  let response = cache.get(cacheKey);

  if (!response) {
    // If a request for this key is already in flight, await it instead of starting a new one
    if (!inFlightAboveRequests.has(cacheKey)) {
      console.warn(
        `Cache miss for ${cacheKey}, fetching fresh satellite data.`,
      );
      const promise = (async () => {
        try {
          const fresh = await satellitesAbove(lat, lon, alt, radius);
          if (!fresh.error) {
            console.error(
              `N2YO API Usage for /above is ${fresh.info.transactionscount} / 100 calls per hour`,
            );
            fresh.info = {
              ...fresh.info,
              latitude: lat,
              longitude: lon,
              altitude: alt,
              searchRadius: radius,
            };
          } else {
            // If there was an error, still include the request info
            fresh.info = {
              latitude: lat,
              longitude: lon,
              altitude: alt,
              searchRadius: radius,
            };
          }
          // Cache for 2 minutes to avoid N2YO rate limits
          cache.set(cacheKey, fresh, 2 * 60 * 1000);
          return fresh;
        } finally {
          inFlightAboveRequests.delete(cacheKey);
        }
      })();
      inFlightAboveRequests.set(cacheKey, promise);
    }
    response = await inFlightAboveRequests.get(cacheKey);
  }

  return response;
};

export const satellitePositionsCached = async (
  lat,
  lon,
  satId,
  seconds = 40,
) => {
  const cacheKey = `satellite_positions_${satId}`;
  const cacheDuration = 2 * 60 * 1000; // 60 seconds
  let response = cache.get(cacheKey);

  if (!response) {
    console.warn(`Cache miss for ${cacheKey}, fetching fresh satellite data.`);
    response = await satellitePositions(lat, lon, satId, seconds);

    if (!response.error) {
      cache.set(cacheKey, response, cacheDuration);
      console.error(
        `N2YO API Usage for /positions is ${response.info.transactionscount} / 1000 calls per hour`,
      );
    } else {
      // If there was an error, still include the request info
      response.info = {
        latitude: lat,
        longitude: lon,
        satId: satId,
      };
    }
  }

  return response;
};
