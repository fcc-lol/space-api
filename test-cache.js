import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3102';

async function testCache() {
  console.log('Testing caching system...\n');
  
  // Test 1: First request to solarflares (should cache miss)
  console.log('1. First request to /solarflares (should be a cache miss):');
  const start1 = Date.now();
  const response1 = await fetch(`${BASE_URL}/solarflares`);
  const data1 = await response1.json();
  const time1 = Date.now() - start1;
  console.log(`   Response time: ${time1}ms`);
  console.log(`   Data length: ${Array.isArray(data1) ? data1.length : 'N/A'}\n`);
  
  // Test 2: Second request to solarflares (should cache hit)
  console.log('2. Second request to /solarflares (should be a cache hit):');
  const start2 = Date.now();
  const response2 = await fetch(`${BASE_URL}/solarflares`);
  const data2 = await response2.json();
  const time2 = Date.now() - start2;
  console.log(`   Response time: ${time2}ms`);
  console.log(`   Data length: ${Array.isArray(data2) ? data2.length : 'N/A'}\n`);
  
  // Test 3: Check cache status
  console.log('3. Checking cache status:');
  const statusResponse = await fetch(`${BASE_URL}/cache/status`);
  const status = await statusResponse.json();
  console.log('   Cache status:', JSON.stringify(status, null, 2));
  
  // Test 4: Test another endpoint
  console.log('\n4. Testing /earthnow endpoint:');
  const start3 = Date.now();
  const response3 = await fetch(`${BASE_URL}/earthnow`);
  const data3 = await response3.json();
  const time3 = Date.now() - start3;
  console.log(`   Response time: ${time3}ms`);
  console.log(`   Data length: ${Array.isArray(data3) ? data3.length : 'N/A'}\n`);
  
  // Test 5: Check cache status again
  console.log('5. Checking cache status after /earthnow:');
  const statusResponse2 = await fetch(`${BASE_URL}/cache/status`);
  const status2 = await statusResponse2.json();
  console.log('   Cache status:', JSON.stringify(status2, null, 2));
}

// Run the test
testCache().catch(console.error);
