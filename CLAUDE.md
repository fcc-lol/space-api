# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev    # Development with nodemon on port 3102
npm start      # Production
```

Tests are standalone scripts — run individually with `node test-*.js` (e.g., `node test-cache.js`). There is no test runner.

## Architecture

### Entry Point

`server.js` is the sole entry point. It imports named exports from all modules, registers Express routes, registers cache refresh functions, and sets a 15-minute `setInterval` that calls `cache.refreshAll()`.

### Module Pattern

Every module in `modules/` follows the same pattern:

1. Defines `CACHE_DURATIONS` constants at the top
2. Has private `fetch*()` functions that call external APIs
3. Exports `get*Cached()` functions that wrap fetchers with cache check/set

```js
export async function getSolarWindCached() {
  const key = 'aurora_solar_wind';
  let data = cache.get(key);
  if (!data) {
    data = await fetchSolarWind();
    cache.set(key, data, CACHE_DURATIONS.solarWind);
  }
  return data;
}
```

The cache singleton (`modules/cache.js`) is imported directly by each module. Cache keys are plain strings — search for the key string to find all usages across modules.

### Cache System

- **Singleton** `Map`-based in-memory cache with per-entry TTL
- `cache.get(key)` returns `null` on miss or expiry
- `cache.set(key, data, durationMs)` stores with a custom TTL
- `cache.registerRefreshFunction(key, fn)` — called in `server.js` for data that should auto-refresh. Satellite data is excluded because it's location-specific.
- Monitoring endpoints: `GET /cache/status`, `GET /cache/item?key=...`, `POST /cache/refresh`

### Data Modules and External APIs

| Module | API Source | Key data |
|---|---|---|
| `geoMagnetic.js` | NOAA SWPC | Solar wind, Kp index, OVATION aurora, DST, GOES |
| `spaceWeather.js` | NASA DONKI | Solar flares, CMEs, SEPs |
| `earthNow.js` | NASA EPIC | Earth imagery |
| `sunImages.js` | Helioviewer | Solar imagery by wavelength |
| `moonData.js` | NASA Dial-a-Moon + USNO | Moon phase, rise/set, imagery |
| `nearEarthObjects.js` | NASA NEO | Asteroids |
| `spaceFlight.js` | The Space Devs | Launches, events, launch vehicles |
| `satellites.js` | N2YO | Satellites above location, positions |

### Utility Modules

- `modules/coordinates.js` — `convertDmsToDecimal(dmsString)` parses `40°41'34.4"N 73°58'54.2"W` style strings into `{ latitude, longitude }`. Used by satellite endpoints and exposed as `GET /dmstodecimals?dms=...`.
- `modules/dates.js` — `getDates(format)` returns `{ today, yesterday, oneWeekAgo, thirtyDaysAgo }`. `convertDateFormat(date)` converts between `YYYY-MM-DD` and `YYYY/MM/DD`.

### API Routes

| Route | Module | Notes |
|---|---|---|
| `GET /solarflares` | spaceWeather | `?startDate=&endDate=` optional |
| `GET /sep` | spaceWeather | `?startDate=&endDate=` optional |
| `GET /cmes` | spaceWeather | `?startDate=&endDate=` optional |
| `GET /neos` | nearEarthObjects | |
| `GET /moon` | moonData | `?lat=&lon=` optional |
| `GET /satellites-above` | satellites | `?lat=&lon=` or `?dms=` |
| `GET /satellite-positions` | satellites | `?satid=` required |
| `GET /spaceflight/launches` | spaceFlight | |
| `GET /spaceflight/next-launch` | spaceFlight | First result from launches |
| `GET /spaceflight/events` | spaceFlight | |
| `GET /spaceflight/launcher-configurations` | spaceFlight | `?search=` optional |
| `GET /earthnow/list` | earthNow | `?date=&variant=` |
| `GET /earthnow/image` | earthNow | Redirects to image URL |
| `GET /earthnow/imageurl` | earthNow | Returns URL JSON |
| `GET /earthnow/metadata` | earthNow | `?date=&variant=&index=` |
| `GET /sun/image` | sunImages | `?wavelength=&width=&height=&date=`; returns PNG with `X-Image-Date` header |
| `GET /sun/regions` | sunImages | `?date=` optional |
| `GET /sun/events` | sunImages | `?types=EPL,DSF,FIL&date=` |
| `GET /sun/wavelengths` | sunImages | Static list |
| `GET /sun/image-params` | sunImages | Returns pixel geometry for sun disc overlay |
| `GET /aurora` | geoMagnetic | Combined summary |
| `GET /aurora/solar-wind` | geoMagnetic | |
| `GET /aurora/kp` | geoMagnetic | Combined current + forecast |
| `GET /aurora/ovation` | geoMagnetic | OVATION aurora probability grid |
| `GET /aurora/historical` | geoMagnetic | `?date=YYYY-MM-DD` required |
| `GET /aurora/dst` | geoMagnetic | |
| `GET /aurora/xray` | geoMagnetic | GOES X-ray flux |
| `GET /aurora/hemispheric-power` | geoMagnetic | |
| `GET /aurora/storm-timeline` | geoMagnetic | |
| `GET /aurora/active-regions` | geoMagnetic | Derived from flares (72h window) |
| `GET /aurora/major-events` | geoMagnetic | Static hardcoded list |
| `GET /dmstodecimals` | coordinates | `?dms=` |
| `GET /status` | server | Full server/cache/activity status |
| `GET /status-page` | server | Serves `status-page.html` |
| `GET /cache/status` | cache | |
| `GET /cache/item` | cache | `?key=` |
| `POST /cache/refresh` | cache | Body: `{ key }` (omit for all) |

### NOAA Data Parsing

NOAA SWPC returns array-of-arrays where the first row is headers. `geoMagnetic.js` has a helper `parseHeaderedArray(data)` to convert to an array of objects.

### Environment

`.env` at the project root requires:
- `NASA_API_KEY`
- `N2YO_API_KEY`

Port defaults to `3102` (overridable via `PORT` env var).

### ES Modules

The project uses `"type": "module"` in `package.json`. All imports use ES module syntax. `import.meta.url` is used instead of `__dirname` where needed.
