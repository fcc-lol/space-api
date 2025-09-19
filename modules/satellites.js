import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = `https://api.n2yo.com/rest/v1/satellite/`

export const satellitesAbove = async (lat, lon, alt, radius) => {
    console.log("satellitesAbove");
    const url = `${API_URL}above/${lat}/${lon}/${alt}/${radius}/0/&apiKey=${process.env.N2YO_API_KEY}`;
    console.log(url);
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching satellites above:", error);
        throw error;
    }
}

export const satellitePositions = async (lat, lon, satId) => {
    const url = `${API_URL}positions/${satId}/${lat}/${lon}/0/36/&apiKey=${process.env.N2YO_API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching satellite positions:", error);
        throw error;
    }
}
