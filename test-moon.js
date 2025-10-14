// Test script for moon data endpoints
// Run this after starting the server with: node test-moon.js

const BASE_URL = 'http://localhost:3102';

async function testEndpoint(name, url) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${name}`);
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
    console.log('Response data:');
    console.log(JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🌙 Moon Data API Tests');
  console.log('Make sure the server is running on port 3102\n');

  const tests = [
    {
      name: 'Moon Data - Default NYC Location',
      url: `${BASE_URL}/moon`,
    },
    {
      name: 'Moon Data - Los Angeles',
      url: `${BASE_URL}/moon?lat=34.0522&lon=-118.2437`,
    },
    {
      name: 'Moon Data - London',
      url: `${BASE_URL}/moon?lat=51.5074&lon=-0.1278`,
    },
    {
      name: 'Moon Data - Tokyo',
      url: `${BASE_URL}/moon?lat=35.6762&lon=139.6503`,
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await testEndpoint(test.name, test.url);
    if (result) {
      passed++;
    } else {
      failed++;
    }

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
