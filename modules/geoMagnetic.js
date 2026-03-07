import fetch from 'node-fetch';
import cache from './cache.js';
import majorEventsData from './major-events.json' with { type: 'json' };

const NOAA_BASE = 'https://services.swpc.noaa.gov';

const URLS = {
  solarWindPlasma: `${NOAA_BASE}/products/solar-wind/plasma-7-day.json`,
  solarWindMag: `${NOAA_BASE}/products/solar-wind/mag-7-day.json`,
  kpIndex: `${NOAA_BASE}/json/planetary_k_index_1m.json`,
  kpForecast: `${NOAA_BASE}/products/noaa-planetary-k-index-forecast.json`,
  ovation: `${NOAA_BASE}/json/ovation_aurora_latest.json`,
  dst1Hour: `${NOAA_BASE}/json/geospace/geospace_dst_1_hour.json`,
  goesMagnetometer1Day: `${NOAA_BASE}/json/goes/primary/magnetometers-1-day.json`,
  goesXray1Day: `${NOAA_BASE}/json/goes/primary/xrays-1-day.json`,
  hemisphericPower: `${NOAA_BASE}/text/aurora-nowcast-hemi-power.txt`,
  gfzPotsdam: `https://kp.gfz.de/app/json/`
};

const CACHE_DURATIONS = {
  solarWind: 1 * 60 * 1000,        // 1 minute — data updates every minute
  kpCurrent: 1 * 60 * 1000,        // 1 minute
  kpForecast: 60 * 60 * 1000,      // 1 hour
  ovation: 60 * 1000,               // 1 minute
  dst: 10 * 60 * 1000,              // 10 minutes
  dstHistory: 10 * 60 * 1000,       // 10 minutes
  xray: 1 * 60 * 1000,              // 1 minute — GOES updates continuously
  hemisphericPower: 10 * 60 * 1000, // 10 minutes
  stormTimeline: 5 * 60 * 1000,     // 5 minutes
  goes: 1 * 60 * 1000,              // 1 minute
  historicalKp: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Parse NOAA's array-of-arrays format where first row is headers.
 */
function parseHeaderedArray(data) {
  const [headers, ...rows] = data;
  return rows.map((row) => {
    const obj = {};
    headers.forEach((key, i) => {
      obj[key] = row[i];
    });
    return obj;
  });
}

/**
 * Walk backwards through an array to find the most recent entry
 * where `requiredField` is not null.
 */
function getLatestNonNull(rows, requiredField) {
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i][requiredField] !== null && rows[i][requiredField] !== undefined) {
      return rows[i];
    }
  }
  return rows[rows.length - 1];
}

/**
 * Dynamic pressure in nPa: P = 1.6726e-6 * n * v²
 * n = proton density (cm⁻³), v = solar wind speed (km/s)
 */
function calculatePressure(density, speed) {
  if (density === null || speed === null) return null;
  return parseFloat(
    (1.6726e-6 * parseFloat(density) * Math.pow(parseFloat(speed), 2)).toFixed(3),
  );
}

/**
 * Map a Kp value to a human-readable geomagnetic storm level and
 * approximate equatorward visibility latitude.
 */
function describeKp(kp) {
  const k = parseFloat(kp);
  if (k >= 9) return { storm: 'G5 (Extreme)', visibility: 'Aurora may be visible to ~40° latitude' };
  if (k >= 8) return { storm: 'G4 (Severe)', visibility: 'Aurora may be visible to ~45° latitude' };
  if (k >= 7) return { storm: 'G3 (Strong)', visibility: 'Aurora may be visible to ~50° latitude' };
  if (k >= 6) return { storm: 'G2 (Moderate)', visibility: 'Aurora may be visible to ~55° latitude' };
  if (k >= 5) return { storm: 'G1 (Minor)', visibility: 'Aurora may be visible to ~60° latitude' };
  if (k >= 4) return { storm: null, visibility: 'Aurora likely visible at high latitudes (>65°)' };
  if (k >= 2) return { storm: null, visibility: 'Aurora visible near polar regions only' };
  return { storm: null, visibility: 'Quiet — aurora near poles only' };
}

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

async function fetchSolarWind() {
  const [plasmaRes, magRes] = await Promise.all([
    fetch(URLS.solarWindPlasma),
    fetch(URLS.solarWindMag),
  ]);

  if (!plasmaRes.ok) throw new Error(`Solar wind plasma fetch failed: ${plasmaRes.status}`);
  if (!magRes.ok) throw new Error(`Solar wind mag fetch failed: ${magRes.status}`);

  const plasmaRows = parseHeaderedArray(await plasmaRes.json());
  const magRows = parseHeaderedArray(await magRes.json());

  const p = getLatestNonNull(plasmaRows, 'speed');
  const m = getLatestNonNull(magRows, 'bz_gsm');

  const density = p.density !== null ? parseFloat(p.density) : null;
  const speed = p.speed !== null ? parseFloat(p.speed) : null;
  const temperature = p.temperature !== null ? parseFloat(p.temperature) : null;
  const bz = m.bz_gsm !== null ? parseFloat(m.bz_gsm) : null;
  const bt = m.bt !== null ? parseFloat(m.bt) : null;
  const bx = m.bx_gsm !== null ? parseFloat(m.bx_gsm) : null;
  const by = m.by_gsm !== null ? parseFloat(m.by_gsm) : null;

  return {
    plasma: {
      timestamp: p.time_tag,
      density,
      densityUnit: 'protons/cm³',
      speed,
      speedUnit: 'km/s',
      temperature,
      temperatureUnit: 'K',
      pressure: calculatePressure(density, speed),
      pressureUnit: 'nPa',
    },
    magneticField: {
      timestamp: m.time_tag,
      bz,
      bx,
      by,
      bt,
      unit: 'nT',
      bzDescription:
        bz === null
          ? null
          : bz < 0
            ? 'Southward (aurora-favorable)'
            : 'Northward (aurora-suppressing)',
    },
  };
}

async function fetchKpCurrent() {
  const res = await fetch(URLS.kpIndex);
  if (!res.ok) throw new Error(`Kp index fetch failed: ${res.status}`);

  const data = await res.json();
  const latest = data[data.length - 1];

  return {
    timestamp: latest.time_tag,
    kpIndex: latest.kp_index,
    estimatedKp: latest.estimated_kp,
    kpLabel: latest.kp,
    ...describeKp(latest.estimated_kp),
  };
}

async function fetchKpForecast() {
  const res = await fetch(URLS.kpForecast);
  if (!res.ok) throw new Error(`Kp forecast fetch failed: ${res.status}`);

  const rows = parseHeaderedArray(await res.json());

  const entries = rows.map((row) => ({
    timestamp: row.time_tag,
    kp: parseFloat(row.kp),
    type: row.observed, // 'observed', 'estimated', or 'predicted'
    noaaScale: row.noaa_scale || null,
    ...describeKp(row.kp),
  }));

  return {
    observed: entries.filter((e) => e.type === 'observed'),
    estimated: entries.filter((e) => e.type === 'estimated'),
    predicted: entries.filter((e) => e.type === 'predicted'),
  };
}

async function fetchOvation() {
  const res = await fetch(URLS.ovation);
  if (!res.ok) throw new Error(`OVATION fetch failed: ${res.status}`);
  return await res.json();
}

async function fetchGeospaceDst() {
  const res = await fetch(URLS.dst1Hour);
  if (!res.ok) throw new Error(`Dst fetch failed: ${res.status}`);
  const data = await res.json();
  // Return the most recent entry
  return data[data.length - 1];
}

async function fetchGOESMagnetometer() {
  const res = await fetch(URLS.goesMagnetometer1Day);
  if (!res.ok) throw new Error(`GOES fetch failed: ${res.status}`);
  const data = await res.json();
  // Return the most recent entry
  return data[data.length - 1];
}

async function fetchGeospaceDstHistory() {
  const res = await fetch(URLS.dst1Hour);
  if (!res.ok) throw new Error(`Dst history fetch failed: ${res.status}`);
  const data = await res.json();

  const trend = data.map((entry) => ({
    timestamp: entry.time_tag,
    value: entry.dst !== undefined ? parseFloat(entry.dst) : null,
  })).filter((e) => e.value !== null);

  const current = trend.length > 0 ? trend[trend.length - 1] : null;

  return {
    current: current
      ? { ...current, description: describeDst(current.value) }
      : null,
    trend,
    unit: 'nT',
    fetchedAt: new Date().toISOString(),
  };
}

function describeDst(value) {
  if (value === null) return null;
  if (value <= -200) return 'Intense storm';
  if (value <= -100) return 'Severe storm';
  if (value <= -50) return 'Moderate storm conditions';
  if (value <= -30) return 'Minor storm conditions';
  return 'Quiet';
}

/**
 * Classify GOES X-ray flux into NOAA flare class letter.
 * Short-wave channel 0.1–0.8 nm in W/m².
 */
function classifyXray(flux) {
  if (flux === null || flux === undefined) return null;
  const f = parseFloat(flux);
  if (f >= 1e-4) return 'X';
  if (f >= 1e-5) return 'M';
  if (f >= 1e-6) return 'C';
  if (f >= 1e-7) return 'B';
  return 'A';
}

async function fetchXray() {
  const res = await fetch(URLS.goesXray1Day);
  if (!res.ok) throw new Error(`GOES X-ray fetch failed: ${res.status}`);
  const data = await res.json();

  // Filter to the long-channel (0.1–0.8 nm) used for flare classification
  const longChannel = data.filter(
    (e) => e.energy === '0.1-0.8nm' && e.flux !== null,
  );

  if (longChannel.length === 0) {
    return {
      current: null,
      peak24h: null,
      activeAlert: false,
      trend: [],
      unit: 'W/m²',
      fetchedAt: new Date().toISOString(),
    };
  }

  const latest = longChannel[longChannel.length - 1];
  const currentFlux = parseFloat(latest.flux);

  // Find peak in the last 24 hours
  let peakEntry = longChannel[0];
  for (const e of longChannel) {
    if (parseFloat(e.flux) > parseFloat(peakEntry.flux)) peakEntry = e;
  }
  const peakFlux = parseFloat(peakEntry.flux);
  const peakClass = classifyXray(peakFlux);

  const trend = longChannel.map((e) => ({
    timestamp: e.time_tag,
    flux: parseFloat(e.flux),
    fluxClass: classifyXray(parseFloat(e.flux)),
  }));

  return {
    current: {
      timestamp: latest.time_tag,
      flux: currentFlux,
      fluxClass: classifyXray(currentFlux),
      energy: '0.1-0.8nm',
    },
    peak24h: {
      timestamp: peakEntry.time_tag,
      flux: peakFlux,
      fluxClass: peakClass,
    },
    activeAlert: peakClass === 'M' || peakClass === 'X',
    trend,
    unit: 'W/m²',
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchHemisphericPower() {
  const res = await fetch(URLS.hemisphericPower);
  if (!res.ok) throw new Error(`Hemispheric power fetch failed: ${res.status}`);
  const text = await res.text();

  // Format: observation_time  forecast_time  north_GW  south_GW
  // Lines starting with '#' are comments
  const trend = text
    .split('\n')
    .filter((line) => line.trim() && !line.startsWith('#'))
    .map((line) => {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 4) return null;
      const north = parseFloat(parts[2]);
      const south = parseFloat(parts[3]);
      // Convert YYYY-MM-DD_HH:MM to ISO
      const timestamp = parts[0].replace('_', 'T') + ':00Z';
      return {
        timestamp,
        north: isNaN(north) ? null : north,
        south: isNaN(south) ? null : south,
        total: isNaN(north) || isNaN(south) ? null : north + south,
      };
    })
    .filter(Boolean);

  const current = trend.length > 0 ? trend[trend.length - 1] : null;

  return {
    current: current || null,
    trend,
    unit: 'GW',
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchHistoricalKp(dateStr) {
  const url = `${URLS.gfzPotsdam}?start=${dateStr}T00:00:00Z&end=${dateStr}T23:59:59Z&index=Kp`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GFZ Potsdam fetch failed: ${res.status}`);
  const data = await res.json();
  
  if (!data.Kp || data.Kp.length === 0) {
    return null;
  }
  
  // Find max Kp for the day to determine overall G-value
  const maxKp = Math.max(...data.Kp);
  const info = describeKp(maxKp);
  
  return {
    date: dateStr,
    maxKp,
    storm: info.storm,
    visibility: info.visibility,
    data: data.datetime.map((time, i) => ({
      timestamp: time,
      kp: data.Kp[i]
    }))
  };
}

// ---------------------------------------------------------------------------
// Cached exports
// ---------------------------------------------------------------------------

export async function getSolarWindCached() {
  const key = 'aurora_solar_wind';
  let data = cache.get(key);
  if (!data) {
    data = await fetchSolarWind();
    cache.set(key, data, CACHE_DURATIONS.solarWind);
  }
  return data;
}

export async function getKpCurrentCached() {
  const key = 'aurora_kp_current';
  let data = cache.get(key);
  if (!data) {
    data = await fetchKpCurrent();
    cache.set(key, data, CACHE_DURATIONS.kpCurrent);
  }
  return data;
}

export async function getKpForecastCached() {
  const key = 'aurora_kp_forecast';
  let data = cache.get(key);
  if (!data) {
    data = await fetchKpForecast();
    cache.set(key, data, CACHE_DURATIONS.kpForecast);
  }
  return data;
}

export async function getOvationCached() {
  const key = 'aurora_ovation';
  let data = cache.get(key);
  if (!data) {
    data = await fetchOvation();
    cache.set(key, data, CACHE_DURATIONS.ovation);
  }
  return data;
}

export async function getGeospaceDstCached() {
  const key = 'aurora_dst';
  let data = cache.get(key);
  if (!data) {
    data = await fetchGeospaceDst();
    cache.set(key, data, CACHE_DURATIONS.dst);
  }
  return data;
}

export async function getGOESMagnetometerCached() {
  const key = 'aurora_goes';
  let data = cache.get(key);
  if (!data) {
    data = await fetchGOESMagnetometer();
    cache.set(key, data, CACHE_DURATIONS.goes);
  }
  return data;
}

export async function getHistoricalKpCached(dateStr) {
  const key = `aurora_historical_${dateStr}`;
  let data = cache.get(key);
  if (!data) {
    data = await fetchHistoricalKp(dateStr);
    cache.set(key, data, CACHE_DURATIONS.historicalKp);
  }
  return data;
}

/**
 * Combined aurora and global geomagnetic summary.
 * Avoids fetching the large OVATION grid unless explicitly requested.
 */
export async function getAuroraSummaryCached() {
  const [solarWind, kp, dst, goes] = await Promise.all([
    getSolarWindCached(),
    getKpCurrentCached(),
    getGeospaceDstCached(),
    getGOESMagnetometerCached()
  ]);

  const bz = solarWind.magneticField.bz;

  return {
    timestamp: new Date().toISOString(),
    solarWind,
    kp,
    dst,
    goes,
    conditions: {
      kpIndex: kp.kpIndex,
      estimatedKp: kp.estimatedKp,
      storm: kp.storm,
      visibility: kp.visibility,
      bzFavorable: bz !== null && bz < 0,
      bzValue: bz,
    },
  };
}

export async function getGeospaceDstHistoryCached() {
  const key = 'aurora_dst_history';
  let data = cache.get(key);
  if (!data) {
    data = await fetchGeospaceDstHistory();
    cache.set(key, data, CACHE_DURATIONS.dstHistory);
  }
  return data;
}

export async function getXrayCached() {
  const key = 'aurora_xray';
  let data = cache.get(key);
  if (!data) {
    data = await fetchXray();
    cache.set(key, data, CACHE_DURATIONS.xray);
  }
  return data;
}

export async function getHemisphericPowerCached() {
  const key = 'aurora_hemispheric_power';
  let data = cache.get(key);
  if (!data) {
    data = await fetchHemisphericPower();
    cache.set(key, data, CACHE_DURATIONS.hemisphericPower);
  }
  return data;
}

/**
 * Build a 72-hour cause-and-effect storm timeline by combining:
 * - NASA DONKI solar flares (cached)
 * - NASA DONKI CMEs (cached)
 * - NOAA Kp forecast (for geomagnetic storm onset detection)
 */
export async function buildStormTimeline() {
  const now = new Date();
  const windowStart = new Date(now.getTime() - 72 * 60 * 60 * 1000);
  const startDateStr = windowStart.toISOString().split('T')[0];
  const endDateStr = now.toISOString().split('T')[0];

  // Fetch all three sources in parallel
  const [flares, cmes, kpForecast] = await Promise.all([
    import('./spaceWeather.js').then((m) =>
      m.fetchData('solarFlares', startDateStr, endDateStr).catch(() => []),
    ),
    import('./spaceWeather.js').then((m) =>
      m.fetchData('CMEs', startDateStr, endDateStr).catch(() => []),
    ),
    getKpForecastCached().catch(() => ({ observed: [], estimated: [], predicted: [] })),
  ]);

  const events = [];

  // Map flares to events
  const flareEvents = (Array.isArray(flares) ? flares : []).map((f) => ({
    id: `flare-${f.beginTime}`,
    type: 'solar_flare',
    timestamp: f.beginTime,
    endTime: f.endTime || null,
    classification: f.classType || null,
    description: `${f.classType || 'Solar'} class flare${f.activeRegionNum ? ` from AR${f.activeRegionNum}` : ''}`,
    causeIds: [],
    effectIds: [],
    confidence: 'confirmed',
    source: 'NASA DONKI',
    _raw: f,
  }));

  // Map CMEs to events
  const cmeEvents = (Array.isArray(cmes) ? cmes : []).map((c) => {
    const analysis = c.cmeAnalyses && c.cmeAnalyses[0];
    const speed = analysis ? Math.round(analysis.speed) : null;
    return {
      id: `cme-${c.startTime}`,
      type: 'cme',
      timestamp: c.startTime,
      endTime: null,
      classification: speed ? `${speed} km/s` : null,
      description: `CME${speed ? ` at ${speed} km/s` : ''}${analysis?.isMostAccurate ? ' (best fit)' : ''}`,
      causeIds: [],
      effectIds: [],
      confidence: 'confirmed',
      source: 'NASA DONKI',
      _raw: c,
      _predictedArrival: analysis?.time21_5 || null,
    };
  });

  // Detect geomagnetic storms from Kp forecast (Kp >= 5)
  const allKpEntries = [
    ...(kpForecast.observed || []),
    ...(kpForecast.estimated || []),
    ...(kpForecast.predicted || []),
  ];

  const stormEntries = allKpEntries.filter((e) => parseFloat(e.kp) >= 5);
  const stormEvents = stormEntries.map((e) => ({
    id: `storm-${e.timestamp}`,
    type: 'geomagnetic_storm',
    timestamp: e.timestamp,
    endTime: null,
    classification: e.storm || `Kp ${e.kp}`,
    description: `Geomagnetic storm — ${e.storm || `Kp ${Math.round(e.kp)}`}`,
    causeIds: [],
    effectIds: [],
    confidence: e.type === 'observed' ? 'confirmed' : 'predicted',
    source: 'NOAA SWPC',
  }));

  events.push(...flareEvents, ...cmeEvents, ...stormEvents);

  // Link flares to CMEs: if a CME starts within 60 minutes after a flare
  for (const cme of cmeEvents) {
    const cmeTime = new Date(cme.timestamp).getTime();
    for (const flare of flareEvents) {
      const flareTime = new Date(flare.timestamp).getTime();
      const diffMin = (cmeTime - flareTime) / 60000;
      if (diffMin >= 0 && diffMin <= 60) {
        flare.effectIds.push(cme.id);
        cme.causeIds.push(flare.id);
      }
    }
  }

  // Link CMEs with predicted arrivals to storm onsets within a 12h window
  for (const cme of cmeEvents) {
    if (!cme._predictedArrival) continue;
    const arrivalTime = new Date(cme._predictedArrival).getTime();
    for (const storm of stormEvents) {
      const stormTime = new Date(storm.timestamp).getTime();
      const diffH = Math.abs(stormTime - arrivalTime) / 3600000;
      if (diffH <= 12) {
        cme.effectIds.push(storm.id);
        storm.causeIds.push(cme.id);
      }
    }
  }

  // Strip internal _raw and _predictedArrival before returning
  const cleanEvents = events
    .map(({ _raw, _predictedArrival, ...e }) => e) // eslint-disable-line no-unused-vars
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return {
    windowStart: windowStart.toISOString(),
    windowEnd: now.toISOString(),
    events: cleanEvents,
    fetchedAt: new Date().toISOString(),
  };
}

export async function getStormTimelineCached() {
  const key = 'aurora_storm_timeline';
  let data = cache.get(key);
  if (!data) {
    data = await buildStormTimeline();
    cache.set(key, data, CACHE_DURATIONS.stormTimeline);
  }
  return data;
}

export function getMajorEvents() {
  return [...majorEventsData].sort((a, b) => new Date(a.date) - new Date(b.date));
}
