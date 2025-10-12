export const getDates = (format = 'dashes') => {
  let today = new Date().toISOString().split('T')[0];
  if (format === 'dashes') {
    today = today.replace(/\//g, '-');
  } else if (format === 'slashes') {
    today = today.replace(/-/g, '/');
  }
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  let yesterdayFormatted = yesterday.toISOString().split('T')[0];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  let thirtyDaysAgoFormatted = thirtyDaysAgo.toISOString().split('T')[0];
  if (format === 'dashes') {
    thirtyDaysAgoFormatted = thirtyDaysAgoFormatted.replace(/\//g, '-');
  } else if (format === 'slashes') {
    thirtyDaysAgoFormatted = thirtyDaysAgoFormatted.replace(/-/g, '/');
  }
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  let oneWeekAgoFormatted = oneWeekAgo.toISOString().split('T')[0];
  if (format === 'dashes') {
    oneWeekAgoFormatted = oneWeekAgoFormatted.replace(/\//g, '-');
  } else if (format === 'slashes') {
    oneWeekAgoFormatted = oneWeekAgoFormatted.replace(/-/g, '/');
  }

  return {
    thirtyDaysAgo: thirtyDaysAgoFormatted,
    oneWeekAgo: oneWeekAgoFormatted,
    yesterday: yesterdayFormatted,
    today: today,
  };
};

/**
 * Converts date from YYYY-MM-DD format to YYYY/MM/DD format
 * @param {string} date - Date in YYYY-MM-DD format or 'latest'
 * @returns {string} - Date in YYYY/MM/DD format or 'latest'
 */
export const convertDateFormat = (date) => {
  // If date is 'latest' or null/undefined, return as is
  if (!date || date === 'latest') {
    return date;
  }

  // Check if date is in YYYY-MM-DD format
  const dashFormat = /^\d{4}-\d{2}-\d{2}$/;
  if (dashFormat.test(date)) {
    // Convert from YYYY-MM-DD to YYYY/MM/DD
    return date.replace(/-/g, '/');
  }

  // If already in YYYY/MM/DD format or other format, return as is
  return date;
};
