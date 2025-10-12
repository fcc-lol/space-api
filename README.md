# Space API

A Node.js Express server that provides access to NASA space data APIs with intelligent caching for optimal performance.

## 🚀 Features

- **Space Weather Data**: Solar flares, coronal mass ejections (CMEs), and solar energetic particles (SEPs)
- **Earth Imagery**: Latest satellite images of Earth from NASA's EPIC API
- **Sun Images**: High-resolution solar imagery from multiple wavelengths using Helioviewer API
- **Near Earth Objects**: Asteroid and comet data from NASA's NEO API
- **Space Flight Data**: Upcoming rocket launches, space events, and launch vehicle configurations from The Space Devs API
- **Satellite Tracking**: Find satellites passing above a specific location using the N2YO API.
- **Smart Caching**: Built-in caching system to reduce API calls and improve response times
- **Date Filtering**: Optional date range parameters for time-sensitive data
- **Cache Management**: Endpoints to monitor and control cache behavior

## 🛠️ Tech Stack

- **Node.js** with ES modules
- **Express.js** web framework
- **NASA, Helioviewer, N2YO, & The Space Devs APIs** for space data
- **Custom caching system** for performance optimization

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
Redirects to the actual sun image data from the Helioviewer API.

**Query Parameters:**
- `date` (optional): Specific date in YYYY-MM-DD format or ISO format. Defaults to 'latest'
- `wavelength` (optional): Solar observation wavelength. Defaults to '171'

**Example:**
```bash
GET /sun/image?date=2024-01-01&wavelength=211
```

#### GET `/sun/screenshot`
Generates a custom PNG screenshot of the sun with specified dimensions.

**Query Parameters:**
- `date` (optional): Specific date in YYYY-MM-DD format or ISO format. Defaults to 'latest'
- `wavelength` (optional): Solar observation wavelength. Defaults to '171'
- `width` (optional): Screenshot width in pixels. Defaults to 1024
- `height` (optional): Screenshot height in pixels. Defaults to 1024
- `imageScale` (optional): Image scale in arcseconds per pixel. Defaults to 2.4204409

**Example:**
```bash
GET /sun/screenshot?width=512&height=512&wavelength=304
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

# Get sun image (redirects to actual image)
curl "http://localhost:3102/sun/image?wavelength=211"

# Get sun screenshot with custom dimensions
curl "http://localhost:3102/sun/screenshot?width=512&height=512&wavelength=171"

# Get available solar wavelengths
curl "http://localhost:3102/sun/wavelengths"

# Get sun data sources
curl "http://localhost:3102/sun/datasources"

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
const earthMetadataResponse = await fetch('http://localhost:3102/earthnow/metadata');
const earthMetadata = await earthMetadataResponse.json();

// Get sun image metadata
const sunMetadataResponse = await fetch('http://localhost:3102/sun/metadata?wavelength=304');
const sunMetadata = await sunMetadataResponse.json();

// Get sun image URL
const sunUrlResponse = await fetch('http://localhost:3102/sun/imageurl?wavelength=193');
const sunImageUrl = await sunUrlResponse.json();

// Get available solar wavelengths
const wavelengthsResponse = await fetch('http://localhost:3102/sun/wavelengths');
const wavelengths = await wavelengthsResponse.json();

// Get sun data sources
const sunDataSourcesResponse = await fetch('http://localhost:3102/sun/datasources');
const sunDataSources = await sunDataSourcesResponse.json();

// Get satellites above specific location
const satellitesResponse = await fetch('http://localhost:3102/satellites-above?lat=51.5074&lon=-0.1278&radius=10');
const satellites = await satellitesResponse.json();

// Get satellite positions for ISS
const satellitePositionsResponse = await fetch('http://localhost:3102/satellite-positions?satid=25544');
const satellitePositions = await satellitePositionsResponse.json();

// Get upcoming space launches
const launchesResponse = await fetch('http://localhost:3102/spaceflight/launches');
const launches = await launchesResponse.json();

// Get next upcoming launch
const nextLaunchResponse = await fetch('http://localhost:3102/spaceflight/next-launch');
const nextLaunch = await nextLaunchResponse.json();

// Get upcoming space events
const eventsResponse = await fetch('http://localhost:3102/spaceflight/events');
const events = await eventsResponse.json();

// Get launch vehicle configurations
const launchersResponse = await fetch('http://localhost:3102/spaceflight/launcher-configurations');
const launchers = await launchersResponse.json();

// Search for specific launch vehicles
const falconResponse = await fetch('http://localhost:3102/spaceflight/launcher-configurations?search=Falcon');
const falconLaunchers = await falconResponse.json();

// Convert DMS coordinates to decimal
const dmsResponse = await fetch('http://localhost:3102/dmstodecimals?dms=40°41\'34.4"N 73°58\'54.2"W');
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
