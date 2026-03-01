import fetch from 'node-fetch';
import cache from './cache.js';

const NOAA_BASE = 'https://services.swpc.noaa.gov';

const URLS = {
  solarWindPlasma: `${NOAA_BASE}/products/solar-wind/plasma-7-day.json`,
  solarWindMag: `${NOAA_BASE}/products/solar-wind/mag-7-day.json`,
  kpIndex: `${NOAA_BASE}/json/planetary_k_index_1m.json`,
  kpForecast: `${NOAA_BASE}/products/noaa-planetary-k-index-forecast.json`,
  ovation: `${NOAA_BASE}/json/ovation_aurora_latest.json`,
  dst1Hour: `${NOAA_BASE}/json/geospace/geospace_dst_1_hour.json`,
  goesMagnetometer1Day: `${NOAA_BASE}/json/goes/primary/magnetometers-1-day.json`,
  gfzPotsdam: `https://kp.gfz.de/app/json/`
};

const CACHE_DURATIONS = {
  solarWind: 1 * 60 * 1000,   // 1 minute — data updates every minute
  kpCurrent: 1 * 60 * 1000,   // 1 minute
  kpForecast: 60 * 60 * 1000, // 1 hour
  ovation: 5 * 60 * 1000,     // 5 minutes
  dst: 10 * 60 * 1000,        // 10 minutes
  goes: 1 * 60 * 1000,        // 1 minute
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
