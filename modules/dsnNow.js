/**
 * DSN Now Module
 * Provides functions to fetch and parse data from NASA's Deep Space Network Now API
 */
import axios from 'axios';
import convert from 'xml-js';
import cache from './cache.js';

// DSN API endpoint
const DSN_API_URL = 'https://eyes.nasa.gov/dsn/data/dsn.xml';

// Cache settings
const CACHE_KEY_DSN = 'dsnNowData';
const DSN_CACHE_DURATION = 60 * 1000; // 1 minute (DSN updates frequently)

/**
 * Fetches raw DSN data from NASA's API
 * @returns {Promise<Object>} The raw DSN data in XML format
 */
async function fetchDsnData() {
  try {
    console.log(`Fetching data from DSN API: ${DSN_API_URL}`);

    const response = await axios.get(DSN_API_URL, {
      headers: {
        Accept: 'text/xml, application/xml',
        'User-Agent': 'Space-API/1.0',
      },
      timeout: 10000, // 10 second timeout
    });

    if (!response.data) {
      throw new Error('Empty response received from DSN API');
    }

    console.log(`DSN API responded with status: ${response.status}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(
        `DSN API error: ${error.response.status}`,
        error.response.data
          ? JSON.stringify(error.response.data).substring(0, 200)
          : 'No response data',
      );
    } else if (error.request) {
      // The request was made but no response was received
      console.error('DSN API no response:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('DSN API request error:', error.message);
    }

    throw new Error(`Failed to fetch DSN data: ${error.message}`);
  }
}

/**
 * Converts the XML DSN data to a more usable JSON format
 * @param {string} xmlData - The XML data from the DSN API
 * @returns {Object} Parsed JSON data
 */
function parseDsnData(xmlData) {
  try {
    // Convert XML to JSON
    const options = { compact: true, ignoreComment: true, spaces: 4 };
    const result = convert.xml2js(xmlData, options);

    // Debug log to see the actual structure
    console.log(
      'DSN API Response Structure:',
      JSON.stringify(result, null, 2).substring(0, 500) + '...',
    );

    // Safely extract data with proper checks
    if (!result || !result.dsn) {
      throw new Error('Invalid API response structure: Missing dsn object');
    }

    const stations = result.dsn.station || [];
    const timestamp = result.dsn._attributes?.timestamp;

    if (!timestamp) {
      throw new Error('Invalid API response: Missing timestamp');
    }

    if (!stations || (Array.isArray(stations) && stations.length === 0)) {
      console.warn('No station data found in DSN response');
    }

    const parsedData = {
      timestamp,
      lastUpdated: new Date(parseInt(timestamp) * 1000).toISOString(),
      stations: Array.isArray(stations)
        ? stations
            .map((station) => {
              if (!station || !station._attributes) {
                console.warn('Invalid station data found, skipping');
                return null;
              }

              // Get dishes for this station - handle missing or empty dish data
              const dishes = station.dish
                ? Array.isArray(station.dish)
                  ? station.dish
                  : [station.dish]
                : [];

              return {
                name: station._attributes.name || 'Unknown',
                friendlyName:
                  station._attributes.friendlyName || 'Unknown Station',
                timeUTC: station._attributes.timeUTC || '',
                timeZoneId: station._attributes.timeZoneId || '',
                dishes: dishes
                  .filter((dish) => dish && dish._attributes)
                  .map((dish) => {
                    // Get targets (spacecraft) for this dish
                    const targets = dish.target
                      ? Array.isArray(dish.target)
                        ? dish.target
                        : [dish.target]
                      : [];

                    return {
                      name:
                        dish._attributes.name ||
                        `Dish-${dish._attributes.n || 'Unknown'}`,
                      number: dish._attributes.n || 'Unknown',
                      azimuthAngle: parseFloat(
                        dish._attributes.azimuthAngle || 0,
                      ),
                      elevationAngle: parseFloat(
                        dish._attributes.elevationAngle || 0,
                      ),
                      isArray: dish._attributes.array === 'true',
                      targets: targets
                        .filter((target) => target && target._attributes)
                        .map((target) => ({
                          name: target._attributes.name || 'Unknown Target',
                          downSignal: target._attributes.downSignal === 'true',
                          downlinkRate: parseInt(
                            target._attributes.downlinkRate || 0,
                          ),
                          upSignal: target._attributes.upSignal === 'true',
                          uplinkRate: parseInt(
                            target._attributes.uplinkRate || 0,
                          ),
                          rtlt: parseFloat(target._attributes.rtlt || 0), // Round-trip light time
                          spacecraft:
                            target._attributes.spacecraft ||
                            target._attributes.name ||
                            'Unknown',
                        })),
                    };
                  }),
              };
            })
            .filter((station) => station !== null)
        : [],
    };

    return parsedData;
  } catch (error) {
    console.error('Error parsing DSN data:', error);
    throw new Error(`Failed to parse DSN data: ${error.message}`);
  }
}

/**
 * Fetches and parses DSN data with caching
 * @returns {Promise<Object>} Processed DSN data
 */
async function getDsnDataCached() {
  // Check if valid data exists in cache
  let cachedData = cache.get(CACHE_KEY_DSN);

  // If no valid cache exists, fetch new data
  if (cachedData === null) {
    try {
      console.log('Fetching fresh DSN data from NASA API');
      const xmlData = await fetchDsnData();

      // Check if we received valid XML data
      if (!xmlData || typeof xmlData !== 'string' || xmlData.trim() === '') {
        throw new Error('Received invalid or empty XML data from DSN API');
      }

      // Log a small sample of the received XML for debugging
      console.log('XML Sample (first 300 chars):', xmlData.substring(0, 300));

      cachedData = parseDsnData(xmlData);
      console.log(
        'Successfully parsed DSN data with stations:',
        cachedData.stations ? cachedData.stations.length : 0,
      );

      // Store in cache with specified duration
      cache.set(CACHE_KEY_DSN, cachedData, DSN_CACHE_DURATION);

      // Register refresh function
      if (!cache.refreshFunctions.has(CACHE_KEY_DSN)) {
        cache.registerRefreshFunction(CACHE_KEY_DSN, async () => {
          const freshXmlData = await fetchDsnData();
          return parseDsnData(freshXmlData);
        });
      }
    } catch (error) {
      console.error('Error fetching DSN data for cache:', error);
      throw error;
    }
  }

  return cachedData;
}

/**
 * Gets the current active missions being tracked by the DSN
 * @returns {Promise<Array>} Array of active missions
 */
async function getActiveMissions() {
  const dsnData = await getDsnDataCached();

  // Extract unique mission names from all stations and dishes
  const missions = new Set();

  // Check if stations exist and are an array before processing
  if (dsnData.stations && Array.isArray(dsnData.stations)) {
    dsnData.stations.forEach((station) => {
      if (station.dishes && Array.isArray(station.dishes)) {
        station.dishes.forEach((dish) => {
          if (dish.targets && Array.isArray(dish.targets)) {
            dish.targets.forEach((target) => {
              if (target.spacecraft || target.name) {
                missions.add(target.spacecraft || target.name);
              }
            });
          }
        });
      }
    });
  } else {
    console.warn('No valid station data found for extracting missions');
  }

  // If no missions found, return an empty array with an informational message
  if (missions.size === 0) {
    return [{ name: 'No active missions found', status: 'information' }];
  }

  return Array.from(missions).map((name) => ({ name }));
}

/**
 * Gets details about a specific mission
 * @param {string} missionName - The name of the mission to get details for
 * @returns {Promise<Object>} Mission details including current connections
 */
async function getMissionDetails(missionName) {
  const dsnData = await getDsnDataCached();

  const connections = [];

  // Ensure data exists before processing
  if (!dsnData.stations || !Array.isArray(dsnData.stations)) {
    console.warn('No valid station data found for mission details');
    return {
      name: missionName,
      connections: [],
      lastUpdated: dsnData.lastUpdated,
      status: 'No active DSN stations found',
    };
  }

  dsnData.stations.forEach((station) => {
    if (!station.dishes || !Array.isArray(station.dishes)) return;

    station.dishes.forEach((dish) => {
      if (!dish.targets || !Array.isArray(dish.targets)) return;

      dish.targets.forEach((target) => {
        const targetName = target.spacecraft || target.name;

        if (targetName.toLowerCase() === missionName.toLowerCase()) {
          connections.push({
            station: station.friendlyName,
            dish: dish.name,
            dishNumber: dish.number,
            downlink: target.downSignal
              ? {
                  active: true,
                  rate: target.downlinkRate,
                }
              : {
                  active: false,
                  rate: 0,
                },
            uplink: target.upSignal
              ? {
                  active: true,
                  rate: target.uplinkRate,
                }
              : {
                  active: false,
                  rate: 0,
                },
            rtlt: target.rtlt, // Round-trip light time in seconds
            azimuthAngle: dish.azimuthAngle,
            elevationAngle: dish.elevationAngle,
          });
        }
      });
    });
  });

  return {
    name: missionName,
    connections,
    lastUpdated: dsnData.lastUpdated,
  };
}

/**
 * Gets a summary of DSN activity grouped by station
 * @returns {Promise<Object>} DSN activity summary
 */
async function getDsnSummary() {
  const dsnData = await getDsnDataCached();

  // Check if stations exist before processing
  if (
    !dsnData.stations ||
    !Array.isArray(dsnData.stations) ||
    dsnData.stations.length === 0
  ) {
    return {
      lastUpdated: dsnData.lastUpdated,
      status: 'No active stations found',
      stations: [],
    };
  }

  return {
    lastUpdated: dsnData.lastUpdated,
    stations: dsnData.stations.map((station) => ({
      name: station.friendlyName,
      dishes: station.dishes.map((dish) => ({
        number: dish.number,
        name: dish.name,
        status: dish.targets.length > 0 ? 'Active' : 'Idle',
        targetCount: dish.targets.length,
        targets: dish.targets.map((target) => ({
          name: target.spacecraft || target.name,
          signalStatus: {
            receiving: target.downSignal,
            transmitting: target.upSignal,
          },
        })),
      })),
    })),
  };
}

export {
  getDsnDataCached,
  getActiveMissions,
  getMissionDetails,
  getDsnSummary,
};
