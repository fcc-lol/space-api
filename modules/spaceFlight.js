import fetch from 'node-fetch';

const LAUNCH_API_URL = 'https://ll.thespacedevs.com/2.2.0/launch/upcoming/';
const EVENT_API_URL = 'https://ll.thespacedevs.com/2.2.0/event/upcoming/';
const LAUNCHER_CONFIGURATIONS_API_URL = 'https://ll.thespacedevs.com/2.3.0/launcher_configurations/';

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

export const getUpcomingEvents = async () => {
    try {
        const response = await fetch(EVENT_API_URL, {
            headers: {
                'User-Agent': 'space-api-node-js'
            }
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching upcoming events:", error);
        throw error;
    }
}

export const getLauncherConfigurations = async (search) => {
    try {
        const response = await fetch(`${LAUNCHER_CONFIGURATIONS_API_URL}?search=${search}`, {
            headers: {
                'User-Agent': 'space-api-node-js'
            }
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching launch vehicles:", error);
        throw error;
    }
}