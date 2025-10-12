import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { convertDateFormat, getDates } from './dates.js';
import cache from './cache.js';

dotenv.config();

const NATURAL_URL = 'https://epic.gsfc.nasa.gov/api/natural';
const ENHANCED_URL = 'https://epic.gsfc.nasa.gov/api/enhanced';
const API_URL = 'https://epic.gsfc.nasa.gov/api';

// const apiURLs = {
//     "natural": "https://api.nasa.gov/EPIC/api/natural",
//     "enhanced": "https://api.nasa.gov/EPIC/api/enhanced"
// }

// Helper function to find the most recent available date before the requested date
const findMostRecentAvailableDate = async (
  requestedDate,
  variant = 'natural',
  maxDaysBack = 30,
) => {
  const requested = new Date(requestedDate);

  for (let i = 0; i < maxDaysBack; i++) {
    const checkDate = new Date(requested);
    checkDate.setDate(checkDate.getDate() - i);
    const dateString = checkDate.toISOString().split('T')[0];

    try {
      const url = `${API_URL}/${variant}/date/${dateString}&api_key=${process.env.NASA_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        console.log(`Found images for date: ${dateString}`);
        return dateString;
      }
    } catch (error) {
      console.log(`No images found for date: ${dateString}`);
      continue;
    }
  }

  // If no images found in the last 30 days, return 'latest'
  console.log('No images found in the last 30 days, falling back to latest');
  return 'latest';
};

export const getEarthImageryMetadata = async (
  date = 'latest',
  variant = 'natural',
) => {
  try {
    console.log(`~~~~~~~~~~~~ Date is ${date}`);

    // If date is 'latest', use the original logic
    if (date === 'latest') {
      const url = `${API_URL}/${variant}/images&api_key=${process.env.NASA_API_KEY}`;
      console.log(`~~~~~~~~~~~~ URL is ${url}`);
      const response = await fetch(url);
      const data = await response.json();

      if (Array.isArray(data)) {
        data.forEach((item) => {
          if (item.image && item.date) {
            // Extract YYYY-MM-DD from "YYYY-MM-DD HH:MM:SS"
            const datePart = item.date.split(' ')[0]; // "2025-07-15"
            const imageDate = datePart.replace(/-/g, '/'); // "2025/07/15"
            item.url = `https://epic.gsfc.nasa.gov/archive/${variant}/${imageDate}/png/${item.image}.png`;
          }
        });
      }
      return data;
    }

    // For specific dates, first try the requested date
    let url = `${API_URL}/${variant}/date/${date}&api_key=${process.env.NASA_API_KEY}`;
    console.log(`~~~~~~~~~~~~ URL is ${url}`);
    let response = await fetch(url);
    let data = await response.json();

    // If no images found for the requested date, find the most recent available date
    if (!Array.isArray(data) || data.length === 0) {
      console.log(
        `No images found for requested date ${date}, searching for most recent available date...`,
      );
      const fallbackDate = await findMostRecentAvailableDate(date, variant);

      if (fallbackDate === 'latest') {
        // Use the latest endpoint
        url = `${API_URL}/${variant}/images&api_key=${process.env.NASA_API_KEY}`;
      } else {
        // Use the found date
        url = `${API_URL}/${variant}/date/${fallbackDate}&api_key=${process.env.NASA_API_KEY}`;
      }

      console.log(`~~~~~~~~~~~~ Fallback URL is ${url}`);
      response = await fetch(url);
      data = await response.json();
    }

    if (Array.isArray(data)) {
      data.forEach((item) => {
        if (item.image && item.date) {
          // Extract YYYY-MM-DD from "YYYY-MM-DD HH:MM:SS"
          const datePart = item.date.split(' ')[0]; // "2025-07-15"
          const imageDate = datePart.replace(/-/g, '/'); // "2025/07/15"
          item.url = `https://epic.gsfc.nasa.gov/archive/${variant}/${imageDate}/png/${item.image}.png`;
        }
      });
    }
    return data;
  } catch (error) {
    console.error('Error fetching Earth imagery:', error);
    throw error;
  }
};

export const getEarthImageURL = async (
  date = 'latest',
  variant = 'natural',
  index = 0,
) => {
  const metadata = await getEarthImageryMetadata(date, variant);
  const cappedIndex = Math.min(index, Math.max(0, metadata.length - 1));
  console.log(metadata[cappedIndex]);
  const imageUrl = metadata[cappedIndex].url;
  return imageUrl;
};

export const getEarthImage = async (
  date = 'latest',
  variant = 'natural',
  index = 0,
) => {
  const imageUrl = await getEarthImageURL(date, variant, index);
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();
  return imageBuffer;
};

// Cached wrapper functions
export const getEarthImageryMetadataCached = async (
  date = 'latest',
  variant = 'natural',
  index = 0,
) => {
  const cacheKey = `earthnow_metadata_${date}_${variant}`;
  let response = cache.get(cacheKey);

  if (!response) {
    response = await getEarthImageryMetadata(date, variant, index);
    cache.set(cacheKey, response);
  }

  return response;
};

export const getEarthImageryListCached = async (
  date = 'latest',
  variant = 'natural',
) => {
  const cacheKey = `earthnow_list_${date}_${variant}`;
  let response = cache.get(cacheKey);

  if (!response) {
    response = await getEarthImageryMetadata(date, variant);
    cache.set(cacheKey, response);
  }

  return response;
};
