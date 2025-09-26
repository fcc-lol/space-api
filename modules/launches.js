import fetch from 'node-fetch';

const LAUNCH_API_URL = 'https://ll.thespacedevs.com/2.2.0/launch/upcoming/';

export const getUpcomingLaunches = async () => {
    try {
        const response = await fetch(LAUNCH_API_URL, {
            headers: {
                'User-Agent': 'space-api-node-js'
            }
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching upcoming launches:", error);
        throw error;
    }
};
