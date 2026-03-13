import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { getDates } from './dates.js';
import cache from './cache.js';

dotenv.config();

const urls = {
  solarFlares: 'https://api.nasa.gov/DONKI/FLR',
  CMEs: 'https://api.nasa.gov/DONKI/CME',
  SEP: 'https://api.nasa.gov/DONKI/SEP',
};

export const fetchData = async (data, startDate, endDate) => {
  const dates = getDates();
  const url = `${urls[data]}?startDate=${startDate || dates.oneWeekAgo}&endDate=${endDate || dates.today}&api_key=${process.env.NASA_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`NASA DONKI API error: ${response.status} ${response.statusText}`);
    const jsonData = await response.json();
    return jsonData;
  } catch (error) {
    console.error('Error fetching NASA data:', error.message);
    throw error;
  }
};

// Cached wrapper functions
export const fetchDataCached = async (data, startDate, endDate) => {
  const cacheKey = (startDate || endDate)
    ? `${data.toLowerCase()}_${startDate || ''}_${endDate || ''}`
    : data.toLowerCase();
  let response = cache.get(cacheKey);

  if (!response) {
    response = await fetchData(data, startDate, endDate);
    cache.set(cacheKey, response);
  }

  return response;
};
