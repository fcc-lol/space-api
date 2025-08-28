import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { getDates } from './dates.js';

dotenv.config();

const NEO_API_URL = "https://api.nasa.gov/neo/rest/v1/feed";

export const getNeoFeed = async (startDate, endDate) => {
    const dates = getDates();

    try {
        const url = `${NEO_API_URL}?start_date=${startDate || dates.oneWeekAgo}&end_date=${endDate || dates.today}&api_key=${process.env.NASA_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching Near Earth Objects feed:", error);
        throw error;
    }
};
