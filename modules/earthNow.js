import fetch from 'node-fetch';
import dotenv from 'dotenv';
// import {getDates} from './dates.js';

dotenv.config();

const NATURAL_URL = "https://api.nasa.gov/EPIC/api/natural";
const ENHANCED_URL = "https://api.nasa.gov/EPIC/api/enhanced";

const apiURLs = {
    "natural": "https://api.nasa.gov/EPIC/api/natural",
    "enhanced": "https://api.nasa.gov/EPIC/api/enhanced"    
}

export const getEarthImageryMetadata = async (date = 'latest', variant = 'natural') => {
    try {
        const url = `${apiURLs[variant]}?api_key=${process.env.NASA_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        // For each item in the response, add a url property formatted like getEarthImageryUrl
        if (Array.isArray(data)) {
            data.forEach(item => {
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
        console.error("Error fetching Earth imagery:", error);
        throw error;
    }
};

export const getEarthImageURL = async (date = 'latest', variant = 'natural') => {
    const metadata = await getEarthImageryMetadata(date, variant);
    const imageUrl = metadata[0].url;
    return imageUrl;
};

export const getEarthImage = async (date = 'latest', variant = 'natural') => {
    const imageUrl = await getEarthImageURL(date, variant);
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    return imageBuffer;
};