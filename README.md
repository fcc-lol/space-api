# Space API

A Node.js/Express server that aggregates real-time space data from NASA, NOAA, Helioviewer, and other APIs with intelligent in-memory caching.

Runs on port `3102` by default (override with `PORT` env var).

## Setup

```bash
npm install
cp .env.example .env  # add your API keys
npm run dev           # development (nodemon)
npm start             # production
```

**.env** requires:
```
NASA_API_KEY=
N2YO_API_KEY=
```

## API Endpoints

### Aurora / Geomagnetic

| Endpoint | Description |
|---|---|
| `GET /aurora` | Combined aurora summary |
| `GET /aurora/solar-wind` | Real-time solar wind (speed, density, pressure, IMF Bz) from DSCOVR |
| `GET /aurora/kp` | Kp index — current + 3-day forecast |
| `GET /aurora/ovation` | OVATION aurora probability grid (1° resolution) |
| `GET /aurora/historical?date=YYYY-MM-DD` | Historical Kp data for a specific date |
| `GET /aurora/dst` | Geospace Dst index history |
| `GET /aurora/xray` | GOES X-ray flux |
| `GET /aurora/hemispheric-power` | Hemispheric power index |
| `GET /aurora/storm-timeline` | Storm timeline derived from multiple datasets |
| `GET /aurora/active-regions` | Active solar regions derived from flare data (72h window) |
| `GET /aurora/major-events` | Hardcoded list of historically significant aurora events |

### Space Weather (NASA DONKI)

All accept optional `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`.

| Endpoint | Description |
|---|---|
| `GET /solarflares` | Solar flare events |
| `GET /sep` | Solar energetic particle events |
| `GET /cmes` | Coronal mass ejections |

### Sun (Helioviewer)

| Endpoint | Description |
|---|---|
| `GET /sun/image` | PNG screenshot — `?wavelength=193&width=1024&height=1024&date=` — returns `X-Image-Date` header |
| `GET /sun/wavelengths` | Available wavelengths and descriptions |
| `GET /sun/regions` | Active solar regions — `?date=YYYY-MM-DD` optional |
| `GET /sun/events` | Solar events (filaments, etc.) — `?types=EPL,DSF,FIL&date=` |
| `GET /sun/image-params` | Pixel geometry for sun disc overlay (center, radius, scale) |
| `GET /sun/datasources` | All available Helioviewer data sources |

**Available wavelengths:** `94`, `131`, `171`, `193`, `211`, `304`, `335`, `1600`, `1700`, `4500`, `continuum`, `magnetogram`

### Earth (NASA EPIC)

All accept `?date=YYYY-MM-DD` (or `latest`) and `?variant=natural|enhanced`.

| Endpoint | Description |
|---|---|
| `GET /earthnow/list` | List of available imagery for a date |
| `GET /earthnow/image` | Redirects to image — also `?index=0` |
| `GET /earthnow/imageurl` | Returns image URL as JSON |
| `GET /earthnow/metadata` | Image metadata |

### Moon (NASA Dial-a-Moon + USNO)

`GET /moon?lat=40.69&lon=-73.98` — defaults to NYC. Returns phase, rise/set times, imagery, illumination, position.

### Near Earth Objects

`GET /neos` — asteroid feed for the past week (NASA NEO API).

### Space Flight (The Space Devs)

| Endpoint | Description |
|---|---|
| `GET /spaceflight/launches` | Upcoming launches |
| `GET /spaceflight/next-launch` | Next single launch |
| `GET /spaceflight/events` | Upcoming space events |
| `GET /spaceflight/launcher-configurations` | Launch vehicles — `?search=Falcon` optional |

### Satellites (N2YO)

| Endpoint | Description |
|---|---|
| `GET /satellites-above` | Satellites overhead — `?lat=&lon=` or `?dms=40°41'34.4"N 73°58'54.2"W`, plus `?alt=0&radius=7` |
| `GET /satellite-positions` | Positions for a satellite — `?satid=25544` required |

### Utility

| Endpoint | Description |
|---|---|
| `GET /dmstodecimals?dms=...` | Convert DMS coordinates to decimal |
| `GET /status` | Full server + cache + activity status |
| `GET /status-page` | HTML status dashboard |
| `GET /cache/status` | Cache entries and TTLs |
| `GET /cache/item?key=...` | Raw cache entry by key |
| `POST /cache/refresh` | Force refresh — body `{ "key": "..." }` or empty for all |
