# Space API

A Node.js Express server that provides access to NASA space data APIs with intelligent caching for optimal performance.

## 🚀 Features

- **Space Weather Data**: Solar flares, coronal mass ejections (CMEs), and solar energetic particles (SEPs)
- **Earth Imagery**: Latest satellite images of Earth from NASA's EPIC API
- **Sun Images**: High-resolution solar imagery from multiple wavelengths using Helioviewer API
- **Moon Data**: Real-time moon phase, imagery, rise/set times, and position data
- **Near Earth Objects**: Asteroid and comet data from NASA's NEO API
- **Space Flight Data**: Upcoming rocket launches, space events, and launch vehicle configurations from The Space Devs API
- **Satellite Tracking**: Find satellites passing above a specific location using the N2YO API.
- **Smart Caching**: Built-in caching system to reduce API calls and improve response times
- **Date Filtering**: Optional date range parameters for time-sensitive data
- **Cache Management**: Endpoints to monitor and control cache behavior

## 🛠️ Tech Stack

- **Node.js** with ES modules
- **Express.js** web framework
- **NASA, Helioviewer, USNO, N2YO, & The Space Devs APIs** for space data
- **Custom caching system** for performance optimization
- **Cheerio** for HTML parsing

## 📋 Prerequisites

- Node.js (v14 or higher)
- NASA API key ([Get one here](https://api.nasa.gov/))
- N2YO API key ([Get one here](https://www.n2yo.com/api/))

## 🚀 Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd space-api
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory:

```env
NASA_API_KEY=your_nasa_api_key_here
N2YO_API_KEY=your_n2yo_api_key_here
```

4. Start the server:

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3102`

## 📡 API Endpoints

### Space Weather Data

#### GET `/solarflares`

Retrieves solar flare data from NASA's DONKI API.

**Query Parameters:**

- `startDate` (optional): Start date in YYYY-MM-DD format
- `endDate` (optional): End date in YYYY-MM-DD format

**Example:**

```bash
GET /solarflares?startDate=2024-01-01&endDate=2024-01-07
```

#### GET `/sep`

Retrieves Solar Energetic Particle (SEP) data.

**Query Parameters:**

- `startDate` (optional): Start date in YYYY-MM-DD format
- `endDate` (optional): End date in YYYY-MM-DD format

**Example:**

```bash
GET /sep?startDate=2024-01-01
```

#### GET `/cmes`

Retrieves Coronal Mass Ejection (CME) data.

**Query Parameters:**

- `startDate` (optional): Start date in YYYY-MM-DD format
- `endDate` (optional): End date in YYYY-MM-DD format

**Example:**

```bash
GET /cmes?startDate=2024-01-01&endDate=2024-01-07
```

### Earth Imagery

#### GET `/earthnow/list`

Retrieves a list of available Earth imagery from NASA's EPIC API.

**Query Parameters:**

- `date` (optional): Specific date in YYYY-MM-DD format. Defaults to 'latest'
- `variant` (optional): Image variant ('natural' or 'enhanced'). Defaults to 'natural'

**Example:**

```bash
GET /earthnow/list?date=2024-01-01&variant=natural
```

#### GET `/earthnow/imageurl`

Retrieves the URL for the latest Earth imagery from NASA's EPIC API.

**Query Parameters:**

- `date` (optional): Specific date in YYYY-MM-DD format. Defaults to 'latest'
- `variant` (optional): Image variant ('natural' or 'enhanced'). Defaults to 'natural'
- `index` (optional): Image index for the specified date. Defaults to 0

**Example:**

```bash
GET /earthnow/imageurl?date=2024-01-01&variant=natural&index=0
```

#### GET `/earthnow/image`

Retrieves the actual Earth image data from NASA's EPIC API.

**Query Parameters:**

- `date` (optional): Specific date in YYYY-MM-DD format. Defaults to 'latest'
- `variant` (optional): Image variant ('natural' or 'enhanced'). Defaults to 'natural'
- `index` (optional): Image index for the specified date. Defaults to 0

**Example:**

```bash
GET /earthnow/image?date=2024-01-01&variant=enhanced&index=0
```

#### GET `/earthnow/metadata`

Retrieves metadata about the latest Earth imagery.

**Query Parameters:**

- `date` (optional): Specific date in YYYY-MM-DD format. Defaults to 'latest'
- `variant` (optional): Image variant ('natural' or 'enhanced'). Defaults to 'natural'
- `index` (optional): Image index for the specified date. Defaults to 0

**Example:**

```bash
GET /earthnow/metadata?date=2024-01-01&variant=natural&index=0
```

### Sun Images

#### GET `/sun/metadata`

Retrieves metadata for sun images from the Helioviewer API.

**Query Parameters:**

- `date` (optional): Specific date in YYYY-MM-DD format or ISO format. Defaults to 'latest'
- `wavelength` (optional): Solar observation wavelength. Defaults to '171'. See `/sun/wavelengths` for available options

**Example:**

```bash
GET /sun/metadata?date=2024-01-01&wavelength=304
```

#### GET `/sun/imageurl`

Retrieves the direct URL for downloading sun image data (JPEG2000 format).

**Query Parameters:**

- `date` (optional): Specific date in YYYY-MM-DD format or ISO format. Defaults to 'latest'
- `wavelength` (optional): Solar observation wavelength. Defaults to '171'

**Example:**

```bash
GET /sun/imageurl?wavelength=193
```

#### GET `/sun/image`

Generates a custom PNG screenshot of the sun with specified dimensions.

**Query Parameters:**

- `date` (optional): Specific date in YYYY-MM-DD format or ISO format. Defaults to 'latest'
- `wavelength` (optional): Solar observation wavelength. Defaults to '171'
- `width` (optional): Screenshot width in pixels. Defaults to 1024
- `height` (optional): Screenshot height in pixels. Defaults to 1024
- `imageScale` (optional): Image scale in arcseconds per pixel. Defaults to 2.4204409

**Example:**

```bash
GET /sun/image?width=512&height=512&wavelength=304
```

#### GET `/sun/wavelengths`

Retrieves available solar observation wavelengths and their descriptions.

**No parameters required.**

**Example:**

```bash
GET /sun/wavelengths
```

#### GET `/sun/datasources`

Retrieves all available data sources from the Helioviewer API.

**No parameters required.**

**Example:**

```bash
GET /sun/datasources
```

### Near Earth Objects

#### GET `/neos`

Retrieves Near Earth Object (asteroid and comet) data for the past week.

**No parameters currently supported** (returns data for the past week by default).

**Example:**

```bash
GET /neos
```

### Moon Data

#### GET `/moon`

Retrieves comprehensive moon data including phase information, imagery, rise/set times, and position data. Combines data from NASA's Dial-a-Moon API and the US Naval Observatory.

**Query Parameters:**

- `lat` (optional): Latitude in decimal degrees. Defaults to NYC (40.69°N)
- `lon` (optional): Longitude in decimal degrees. Defaults to NYC (-73.98°W)

**Response Structure:**

```json
{
  "phase": {
    "percent": 57.61, // Illuminated percentage (0=new moon, 100=full moon)
    "name": "Waning Gibbous", // Phase name (from USNO)
    "illumination": 51, // Illumination percentage
    "illuminationUnit": "%",
    "age": 21.254, // Age since start of lunar cycle
    "ageUnit": "days"
  },
  "times": {
    "rise": "10:46 PM", // Moonrise time (12-hour format, location-specific)
    "set": "1:38 PM", // Moonset time (12-hour format, location-specific)
    "upperTransit": "5:40 AM" // Time when moon is highest in sky
  },
  "position": {
    "distance": 373600, // Distance from Earth
    "distanceUnit": "km",
    "diameter": 1918.4, // Angular diameter
    "diameterUnit": "arcseconds",
    "j2000_ra": 6.8268, // Right ascension J2000
    "j2000_dec": 27.7461, // Declination J2000
    "subsolar_lon": -74.803, // Subsolar longitude - where Sun is overhead
    "subsolar_lat": -0.868, // Subsolar latitude
    "subearth_lon": 6.491, // Sub-Earth longitude - libration
    "subearth_lat": -6.154, // Sub-Earth latitude - libration
    "posangle": 4.259, // Position angle of north polar axis
    "angleUnit": "degrees"
  },
  "images": {
    "standard": {
      // Standard 730x730 moon image
      "url": "https://...",
      "width": 730,
      "height": 730
    },
    "highres": {
      // High-resolution 5760x3240 annotated image
      "url": "https://...",
      "width": 5760,
      "height": 3240
    },
    "south_up": {
      /* ... */
    }, // South-up orientation (730x730)
    "south_up_highres": {
      /* ... */
    } // South-up high-res (5760x3240)
  },
  "nextPhase": "Last Quarter on 13 October 2025",
  "obscuration": 0, // Percentage inside Earth's umbra (0 except during eclipses)
  "obscurationUnit": "%",
  "location": {
    "latitude": 40.69,
    "longitude": -73.98
  },
  "timestamp": "2025-10-13T06:08:28.724Z",
  "time": "2025-10-13T02:08"
}
```

**Field Descriptions:**

**Phase Information:**

- `phase.percent` - Illuminated percentage of the moon as seen from Earth (0.00 = new moon, 100.00 = full moon)
- `phase.name` - Current moon phase name (e.g., "Waning Gibbous", "First Quarter")
- `phase.illumination` - Percentage of moon's visible disk illuminated (%)
- `phase.age` - Age in days since the start of the current lunar cycle

**Times:**

- `times.rise` - Moonrise time in 12-hour format, specific to the provided location
- `times.set` - Moonset time in 12-hour format, specific to the provided location
- `times.upperTransit` - Time when the moon reaches its highest point in the sky

**Position:**

- `position.distance` - Distance from Earth to Moon (kilometers)
- `position.diameter` - Angular diameter of the moon as it appears from Earth (arcseconds)
- `position.j2000_ra` - J2000 right ascension of the moon (degrees)
- `position.j2000_dec` - J2000 declination of the moon (degrees)
- `position.subsolar_lon/lat` - Longitude and latitude where the Sun is directly overhead on the moon (degrees)
- `position.subearth_lon/lat` - Longitude and latitude where Earth appears directly overhead on the moon; defines libration (degrees)
- `position.posangle` - Position angle of the north polar axis; tilt relative to north celestial pole, measured counterclockwise (degrees)

**Images:**

- `images.standard` - Standard 730x730px moon image at the requested timestamp
- `images.highres` - High-resolution 5760x3240px annotated moon image
- `images.south_up` - South-up orientation version of standard image (730x730px)
- `images.south_up_highres` - South-up orientation version of high-res image (5760x3240px)

**Other:**

- `obscuration` - Percentage of the moon inside Earth's umbra shadow (only non-zero during lunar eclipses)
- `nextPhase` - Description and date of the next primary moon phase

**Examples:**

```bash
# Get moon data for NYC (default location)
GET /moon

# Get moon data for Los Angeles
GET /moon?lat=34.0522&lon=-118.2437

# Get moon data for London
GET /moon?lat=51.5074&lon=-0.1278

# Get moon data for Tokyo
GET /moon?lat=35.6762&lon=139.6503
```

**Features:**

- Real-time moon phase percentage and name
- High-resolution moon imagery (up to 5760x3240)
- Location-specific rise, set, and transit times (in 12-hour format)
- Detailed positional data including distance and diameter
- Next moon phase prediction
- Both standard and south-up oriented images
- Data cached for 15 minutes for optimal performance

### Space Flight Data

#### GET `/spaceflight/launches`

Retrieves upcoming space launch data from The Space Devs API.

**No parameters required.**

**Example:**

```bash
GET /spaceflight/launches
```

#### GET `/spaceflight/next-launch`

Retrieves the next upcoming space launch from The Space Devs API.

**No parameters required.**

**Example:**

```bash
GET /spaceflight/next-launch
```

#### GET `/spaceflight/events`

Retrieves upcoming space events from The Space Devs API.

**No parameters required.**

**Example:**

```bash
GET /spaceflight/events
```

#### GET `/spaceflight/launcher-configurations`

Retrieves launch vehicle configurations from The Space Devs API.

**Query Parameters:**

- `search` (optional): Search term to filter launch vehicles by name

**Examples:**

```bash
# Get all launch vehicle configurations
GET /spaceflight/launcher-configurations

# Search for specific launch vehicles
GET /spaceflight/launcher-configurations?search=Falcon
```

### Satellite Tracking

#### GET `/satellites-above`

Retrieves satellites currently passing above a specific location using the N2YO API.

**Query Parameters:**

- `lat` (optional): Latitude in decimal degrees. Defaults to NYC (40.69°N)
- `lon` (optional): Longitude in decimal degrees. Defaults to NYC (-73.98°W)
- `dms` (optional): Coordinates in DMS format (e.g., `40°41'34.4"N 73°58'54.2"W`). Overrides lat/lon if provided
- `alt` (optional): Observer altitude in kilometers. Defaults to 0
- `radius` (optional): Search radius in degrees. Defaults to 7

**Examples:**

```bash
# Get satellites above NYC (default location)
GET /satellites-above

# Get satellites above specific coordinates
GET /satellites-above?lat=51.5074&lon=-0.1278&alt=0&radius=10

# Get satellites above location using DMS format
GET /satellites-above?dms=51°30'26.6"N 0°7'39.6"W

# Get satellites above with custom altitude and radius
GET /satellites-above?lat=40.7128&lon=-74.0060&alt=100&radius=20
```

#### GET `/satellite-positions`

Retrieves satellite position data for a specific satellite using the N2YO API.

**Query Parameters:**

- `satid` (required): Satellite ID from the N2YO database

**Example:**

```bash
GET /satellite-positions?satid=25544
```

### Utility Endpoints

#### GET `/dmstodecimals`

Converts coordinates from Degrees, Minutes, Seconds (DMS) format to decimal degrees.

**Query Parameters:**

- `dms` (required): Coordinates in DMS format (e.g., `40°41'34.4"N 73°58'54.2"W`)

**Example:**

```bash
GET /dmstodecimals?dms=40°41'34.4"N 73°58'54.2"W
```

## 🔧 Configuration

### Environment Variables

- `NASA_API_KEY`: Your NASA API key (required)

### Server Configuration

- **Port**: 3102 (configurable in `server.js`)
- **Cache TTL**: Configurable in the cache module

## 📊 Data Sources

This API integrates with several space data APIs:

- **NASA DONKI API**: Solar flares, CMEs, and SEPs
- **NASA EPIC API**: Earth imagery
- **Helioviewer API**: High-resolution solar imagery from multiple observatories (SDO, SOHO, STEREO)
- **NASA Dial-a-Moon API**: Real-time moon imagery and phase data
- **US Naval Observatory (USNO)**: Moon rise/set times and astronomical data
- **NASA NEO API**: Near Earth Objects
- **The Space Devs API**: Space flight data including launches, events, and launch vehicles
- **N2YO API**: Satellite tracking and orbital data

## 🗄️ Caching System

The API includes a sophisticated caching system that:

- Automatically caches responses to reduce API calls
- Respects NASA API rate limits
- Provides cache status monitoring
- Allows manual cache refresh
- Improves response times for frequently requested data

## 🚨 Error Handling

All endpoints include proper error handling and will return appropriate HTTP status codes and error messages if:

- NASA API is unavailable
- Invalid dates are provided
- API key is invalid or missing
- Network errors occur

## 📝 Usage Examples

### Using cURL

```bash
# Get solar flares for the last week
curl "http://localhost:3102/solarflares"

# Get CMEs for a specific date range
curl "http://localhost:3102/cmes?startDate=2024-01-01&endDate=2024-01-07"

# Get Earth imagery list
curl "http://localhost:3102/earthnow/list"

# Get latest Earth imagery URL
curl "http://localhost:3102/earthnow/imageurl"

# Get actual Earth image data
curl "http://localhost:3102/earthnow/image"

# Get Earth imagery metadata
curl "http://localhost:3102/earthnow/metadata"

# Get sun image metadata (default: latest, 171Å)
curl "http://localhost:3102/sun/metadata"

# Get sun image metadata for specific wavelength and date
curl "http://localhost:3102/sun/metadata?date=2024-01-01&wavelength=304"

# Get sun image URL
curl "http://localhost:3102/sun/imageurl?wavelength=193"

# Get sun image with custom dimensions
curl "http://localhost:3102/sun/image?width=512&height=512&wavelength=171"

# Get available solar wavelengths
curl "http://localhost:3102/sun/wavelengths"

# Get sun data sources
curl "http://localhost:3102/sun/datasources"

# Get moon data for NYC (default location)
curl "http://localhost:3102/moon"

# Get moon data for specific location (Los Angeles)
curl "http://localhost:3102/moon?lat=34.0522&lon=-118.2437"

# Get satellites above NYC (default location)
curl "http://localhost:3102/satellites-above"

# Get satellites above specific coordinates
curl "http://localhost:3102/satellites-above?lat=51.5074&lon=-0.1278&radius=10"

# Get satellites above location using DMS format
curl "http://localhost:3102/satellites-above?dms=51°30'26.6"N 0°7'39.6"W"

# Get satellite positions for ISS (satellite ID 25544)
curl "http://localhost:3102/satellite-positions?satid=25544"

# Get upcoming space launches
curl "http://localhost:3102/spaceflight/launches"

# Get next upcoming launch
curl "http://localhost:3102/spaceflight/next-launch"

# Get upcoming space events
curl "http://localhost:3102/spaceflight/events"

# Get launch vehicle configurations
curl "http://localhost:3102/spaceflight/launcher-configurations"

# Search for specific launch vehicles
curl "http://localhost:3102/spaceflight/launcher-configurations?search=Falcon"

# Convert DMS coordinates to decimal
curl "http://localhost:3102/dmstodecimals?dms=40°41'34.4\"N 73°58'54.2\"W"
```

### Using JavaScript/Fetch

```javascript
// Get solar flares
const response = await fetch('http://localhost:3102/solarflares');
const solarFlares = await response.json();

// Get NEOs data
const neosResponse = await fetch('http://localhost:3102/neos');
const neos = await neosResponse.json();

// Get Earth imagery list
const earthListResponse = await fetch('http://localhost:3102/earthnow/list');
const earthList = await earthListResponse.json();

// Get Earth imagery URL
const earthUrlResponse = await fetch('http://localhost:3102/earthnow/imageurl');
const earthImageUrl = await earthUrlResponse.json();

// Get Earth imagery metadata
const earthMetadataResponse = await fetch(
  'http://localhost:3102/earthnow/metadata',
);
const earthMetadata = await earthMetadataResponse.json();

// Get sun image metadata
const sunMetadataResponse = await fetch(
  'http://localhost:3102/sun/metadata?wavelength=304',
);
const sunMetadata = await sunMetadataResponse.json();

// Get sun image URL
const sunUrlResponse = await fetch(
  'http://localhost:3102/sun/imageurl?wavelength=193',
);
const sunImageUrl = await sunUrlResponse.json();

// Get sun image with custom dimensions
const sunImageResponse = await fetch(
  'http://localhost:3102/sun/image?width=512&height=512&wavelength=171',
);
// This returns the image data directly

// Get available solar wavelengths
const wavelengthsResponse = await fetch(
  'http://localhost:3102/sun/wavelengths',
);
const wavelengths = await wavelengthsResponse.json();

// Get sun data sources
const sunDataSourcesResponse = await fetch(
  'http://localhost:3102/sun/datasources',
);
const sunDataSources = await sunDataSourcesResponse.json();

// Get moon data for NYC (default location)
const moonResponse = await fetch('http://localhost:3102/moon');
const moonData = await moonResponse.json();
console.log(`Moon phase: ${moonData.phase.name} (${moonData.phase.percent}%)`);
console.log(`Moonrise: ${moonData.times.rise}, Moonset: ${moonData.times.set}`);

// Get moon data for specific location (London)
const moonLondonResponse = await fetch(
  'http://localhost:3102/moon?lat=51.5074&lon=-0.1278',
);
const moonLondonData = await moonLondonResponse.json();

// Get satellites above specific location
const satellitesResponse = await fetch(
  'http://localhost:3102/satellites-above?lat=51.5074&lon=-0.1278&radius=10',
);
const satellites = await satellitesResponse.json();

// Get satellite positions for ISS
const satellitePositionsResponse = await fetch(
  'http://localhost:3102/satellite-positions?satid=25544',
);
const satellitePositions = await satellitePositionsResponse.json();

// Get upcoming space launches
const launchesResponse = await fetch(
  'http://localhost:3102/spaceflight/launches',
);
const launches = await launchesResponse.json();

// Get next upcoming launch
const nextLaunchResponse = await fetch(
  'http://localhost:3102/spaceflight/next-launch',
);
const nextLaunch = await nextLaunchResponse.json();

// Get upcoming space events
const eventsResponse = await fetch('http://localhost:3102/spaceflight/events');
const events = await eventsResponse.json();

// Get launch vehicle configurations
const launchersResponse = await fetch(
  'http://localhost:3102/spaceflight/launcher-configurations',
);
const launchers = await launchersResponse.json();

// Search for specific launch vehicles
const falconResponse = await fetch(
  'http://localhost:3102/spaceflight/launcher-configurations?search=Falcon',
);
const falconLaunchers = await falconResponse.json();

// Convert DMS coordinates to decimal
const dmsResponse = await fetch(
  'http://localhost:3102/dmstodecimals?dms=40°41\'34.4"N 73°58\'54.2"W',
);
const decimalCoords = await dmsResponse.json();
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- [NASA APIs](https://api.nasa.gov/) for providing access to space data
- [The Space Devs API](https://thespacedevs.com/) for space flight data
- [N2YO API](https://www.n2yo.com/api/) for satellite tracking data
- Express.js community for the excellent web framework
- Node.js community for the runtime environment

## 📞 Support

For issues, questions, or contributions, please open an issue on the repository or contact the development team.
