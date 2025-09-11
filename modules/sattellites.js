import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = `https://api.n2yo.com/rest/v1/satellite/`

export const satellitesAbove = async (observer_lat, observer_lng, observer_alt, search_radius) => {
    console.log("sattellitesAbove");
    const url = `${API_URL}above/${observer_lat}/${observer_lng}/${observer_alt}/${search_radius}/0&apiKey=${process.env.N2YO_API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching satellites above:", error);
        throw error;
    }
}
