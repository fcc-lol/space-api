import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const EARTH_API_URL = "https://api.nasa.gov/EPIC/api/natural";

export const getEarthImagery = async (date = 'latest') => {
    try {
        const url = `${EARTH_API_URL}/images?api_key=${process.env.NASA_API_KEY}`;
        console.log(url);
        const response = await fetch(url);
        console.log(response);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching Earth imagery:", error);
        throw error;
    }
};
