/**
 * Converts a single DMS (Degrees, Minutes, Seconds) coordinate component to decimal degrees.
 * @param {string} dmsString - A DMS string like `40°41'34.4"N`.
 * @returns {number} The coordinate in decimal degrees.
 */
const dmsToDecimal = (dmsString) => {
  const parts = dmsString.match(/(\d+)\D+(\d+)\D+(\d+(\.\d+)?)\D*([NSEW])/);
  if (!parts) {
    throw new Error(`Invalid DMS string format: ${dmsString}`);
  }

  const degrees = parseFloat(parts[1]);
  const minutes = parseFloat(parts[2]);
  const seconds = parseFloat(parts[3]);
  const direction = parts[5];

  let decimal = degrees + minutes / 60 + seconds / 3600;

  if (direction === 'S' || direction === 'W') {
    decimal = -decimal;
  }

  return decimal;
};

/**
 * Converts a DMS coordinate string (latitude and longitude) to decimal degrees.
 * @param {string} dmsString - A string containing both latitude and longitude in DMS format, e.g., `40°41'34.4"N 73°58'54.2"W`.
 * @returns {{latitude: number, longitude: number}} An object with decimal latitude and longitude.
 */
export const convertDmsToDecimal = (dmsString) => {
  if (isValidDms(dmsString)) {
    return {
      latitude: dmsToDecimal(dmsString.split(' ')[0]),
      longitude: dmsToDecimal(dmsString.split(' ')[1]),
    };
  }
  // If the string is not valid, throw an error
  throw new Error(`Invalid DMS string format: ${dmsString}`);
};
/**
 * Validates if a given string is in a valid DMS (Degrees, Minutes, Seconds) format.
 * Expected format: `40°41'34.4"N 73°58'54.2"W`
 * @param {string} dmsString - The string to validate.
 * @returns {boolean} True if the string is a valid DMS format, false otherwise.
 */
export const isValidDms = (dmsString) => {
  // Regex to match a single DMS coordinate (e.g., 40°41'34.4"N)
  const singleDmsRegex = /\d+°\d+'\d+(\.\d+)?"[NSEW]/;

  // Split the string into two potential DMS parts (latitude and longitude)
  const parts = dmsString.trim().split(/\s+/);

  // A valid DMS string for lat/lon should have exactly two parts
  if (parts.length !== 2) {
    return false;
  }

  // Check if both parts match the single DMS regex
  return singleDmsRegex.test(parts[0]) && singleDmsRegex.test(parts[1]);
};
