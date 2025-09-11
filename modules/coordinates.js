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

    let decimal = degrees + (minutes / 60) + (seconds / 3600);

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
    const [latDms, lonDms] = dmsString.trim().split(/\s+/);
    return {
        latitude: dmsToDecimal(latDms),
        longitude: dmsToDecimal(lonDms),
    };
};