# Space API

A Node.js Express server that provides access to NASA space data APIs with intelligent caching for optimal performance.

## 🚀 Features

- **Space Weather Data**: Solar flares, coronal mass ejections (CMEs), and solar energetic particles (SEPs)
- **Earth Imagery**: Latest satellite images of Earth from NASA's EPIC API
- **Near Earth Objects**: Asteroid and comet data from NASA's NEO API
- **Satellite Tracking**: Find satellites passing above a specific location using the N2YO API.
- **Smart Caching**: Built-in caching system to reduce API calls and improve response times
- **Date Filtering**: Optional date range parameters for time-sensitive data
- **Cache Management**: Endpoints to monitor and control cache behavior

## 🛠️ Tech Stack

- **Node.js** with ES modules
- **Express.js** web framework
- **NASA & N2YO APIs** for space data
- **Custom caching system** for performance optimization

## 📋 Prerequisites

- Node.js (v14 or higher)
- NASA API key ([Get one here](https://api.nasa.gov/))

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

#### GET `/earthnow/imageurl`
Retrieves the URL for the latest Earth imagery from NASA's EPIC API.

**Query Parameters:**
- `date` (optional): Specific date in YYYY-MM-DD format
- `variant` (optional): Image variant ('natural' or 'enhanced'). Defaults to 'natural'

**Example:**
```bash
GET /earthnow/imageurl?date=2024-01-01&variant=natural
```

#### GET `/earthnow/image`
Retrieves the actual Earth image data from NASA's EPIC API.

**Query Parameters:**
- `date` (optional): Specific date in YYYY-MM-DD format
- `variant` (optional): Image variant ('natural' or 'enhanced'). Defaults to 'natural'

**Example:**
```bash
GET /earthnow/image?date=2024-01-01&variant=enhanced
```

#### GET `/earthnow/metadata`
Retrieves metadata about the latest Earth imagery.

**No parameters required.**

**Example:**
```bash
GET /earthnow/metadata
```

### Near Earth Objects

#### GET `/neos`
Retrieves Near Earth Object (asteroid and comet) data for the past week.

**No parameters currently supported** (returns data for the past week by default).

**Example:**
```bash
GET /neos
```

### Cache Management

#### GET `/cache/status`
Returns the current status of all cached data including timestamps and cache keys.

**Example:**
```bash
GET /cache/status
```

#### POST `/cache/refresh`
Forces a refresh of cached data.

**Request Body:**
```json
{
  "key": "solarflares"  // Optional: specific cache key to refresh
}
```

**Examples:**
```bash
# Refresh specific cache entry
POST /cache/refresh
Content-Type: application/json

{
  "key": "solarflares"
}

# Refresh all cache entries
POST /cache/refresh
Content-Type: application/json

{}
```

## 🔧 Configuration

### Environment Variables

- `NASA_API_KEY`: Your NASA API key (required)

### Server Configuration

- **Port**: 3102 (configurable in `server.js`)
- **Cache TTL**: Configurable in the cache module

## 📊 Data Sources

This API integrates with several NASA APIs:

- **DONKI API**: Solar flares, CMEs, and SEPs
- **EPIC API**: Earth imagery
- **NEO API**: Near Earth Objects

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

# Get latest Earth imagery URL
curl "http://localhost:3102/earthnow/imageurl"

# Get actual Earth image data
curl "http://localhost:3102/earthnow/image"

# Get Earth imagery metadata
curl "http://localhost:3102/earthnow/metadata"

# Check cache status
curl "http://localhost:3102/cache/status"
```

### Using JavaScript/Fetch

```javascript
// Get solar flares
const response = await fetch('http://localhost:3102/solarflares');
const solarFlares = await response.json();

// Get NEOs data
const neosResponse = await fetch('http://localhost:3102/neos');
const neos = await neosResponse.json();

// Get Earth imagery URL
const earthUrlResponse = await fetch('http://localhost:3102/earthnow/imageurl');
const earthImageUrl = await earthUrlResponse.json();
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
- Express.js community for the excellent web framework
- Node.js community for the runtime environment

## 📞 Support

For issues, questions, or contributions, please open an issue on the repository or contact the development team.
