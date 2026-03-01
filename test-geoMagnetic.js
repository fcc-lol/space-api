import fetch from 'node-fetch';
import {
  getAuroraSummaryCached,
  getSolarWindCached,
  getKpCurrentCached,
  getKpForecastCached,
  getOvationCached,
} from './modules/geoMagnetic.js';

const BASE_URL = 'http://localhost:3102';

async function testEndpoint(name, url) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing Endpoint: ${name}`);
  console.log(`URL: ${url}`);
  console.log('='.repeat(60));

  try {
    const startTime = Date.now();
    const response = await fetch(url);
    const duration = Date.now() - startTime;

    if (!response.ok) {
      console.error(`❌ Failed: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error('Response:', text);
      return false;
    }

    const data = await response.json();
    console.log(`✅ Success (${duration}ms)`);
    // Output a snippet to avoid flooding the console
    const summary = JSON.stringify(data).substring(0, 150) + '...';
    console.log(`Response data snippet: ${summary}`);
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

async function testModuleFunction(name, fn) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing Module Function: ${name}`);
  console.log('='.repeat(60));

  try {
    const startTime = Date.now();
    const data = await fn();
    const duration = Date.now() - startTime;

    console.log(`✅ Success (${duration}ms)`);
    // Output a snippet
    const summary = JSON.stringify(data).substring(0, 150) + '...';
    console.log(`Response data snippet: ${summary}`);
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🌌 Aurora API Tests');
  console.log('Make sure the server is running on port 3102\n');

  let passed = 0;
  let failed = 0;

  // --- Test Module Functions ---
  const moduleTests = [
    { name: 'getAuroraSummaryCached()', fn: getAuroraSummaryCached },
    { name: 'getSolarWindCached()', fn: getSolarWindCached },
    { name: 'getKpCurrentCached()', fn: getKpCurrentCached },
    { name: 'getKpForecastCached()', fn: getKpForecastCached },
    // Ovation gets a lot of data, but we'll test it anyway
    { name: 'getOvationCached()', fn: getOvationCached },
  ];

  for (const test of moduleTests) {
    const result = await testModuleFunction(test.name, test.fn);
    if (result) passed++;
    else failed++;
  }

  // --- Test Endpoints ---
  const endpointTests = [
    { name: '/aurora', url: `${BASE_URL}/aurora` },
    { name: '/aurora/solar-wind', url: `${BASE_URL}/aurora/solar-wind` },
    { name: '/aurora/kp', url: `${BASE_URL}/aurora/kp` },
    // OVATION endpoint
    { name: '/aurora/ovation', url: `${BASE_URL}/aurora/ovation` },
  ];

  for (const test of endpointTests) {
    const result = await testEndpoint(test.name, test.url);
    if (result) passed++;
    else failed++;
    
    // Add a small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above.');
  }
}

runTests().catch(console.error);
