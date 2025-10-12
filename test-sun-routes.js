import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3102';

async function testSunRoutes() {
  console.log('Testing Sun Image API routes...\n');

  try {
    // Test 1: Get available wavelengths
    console.log('1. Testing /sun/wavelengths:');
    const start1 = Date.now();
    const response1 = await fetch(`${BASE_URL}/sun/wavelengths`);
    const data1 = await response1.json();
    const time1 = Date.now() - start1;
    console.log(`   Response time: ${time1}ms`);
    console.log(`   Status: ${response1.status}`);
    console.log(`   Available wavelengths: ${data1.available_wavelengths?.length || 0}`);
    console.log(`   Example wavelength: ${data1.available_wavelengths?.[0]} - ${data1.wavelength_info?.[0]?.description}\n`);

    // Test 2: Get sun image metadata (default: latest, 171Å)
    console.log('2. Testing /sun/metadata (default params):');
    const start2 = Date.now();
    const response2 = await fetch(`${BASE_URL}/sun/metadata`);
    const data2 = await response2.json();
    const time2 = Date.now() - start2;
    console.log(`   Response time: ${time2}ms`);
    console.log(`   Status: ${response2.status}`);
    console.log(`   Image ID: ${data2.id}`);
    console.log(`   Date: ${data2.date}`);
    console.log(`   Wavelength: ${data2.wavelength}`);
    console.log(`   Size: ${data2.width}x${data2.height}px\n`);

    // Test 3: Get sun image metadata with specific wavelength
    console.log('3. Testing /sun/metadata?wavelength=304:');
    const start3 = Date.now();
    const response3 = await fetch(`${BASE_URL}/sun/metadata?wavelength=304`);
    const data3 = await response3.json();
    const time3 = Date.now() - start3;
    console.log(`   Response time: ${time3}ms`);
    console.log(`   Status: ${response3.status}`);
    console.log(`   Image ID: ${data3.id}`);
    console.log(`   Date: ${data3.date}`);
    console.log(`   Wavelength: ${data3.wavelength}\n`);

    // Test 4: Get sun image URL
    console.log('4. Testing /sun/imageurl?wavelength=171:');
    const start4 = Date.now();
    const response4 = await fetch(`${BASE_URL}/sun/imageurl?wavelength=171`);
    const data4 = await response4.json();
    const time4 = Date.now() - start4;
    console.log(`   Response time: ${time4}ms`);
    console.log(`   Status: ${response4.status}`);
    console.log(`   URL: ${data4.url}\n`);

    // Test 5: Test sun image redirect
    console.log('5. Testing /sun/image redirect (checking headers only):');
    const start5 = Date.now();
    const response5 = await fetch(`${BASE_URL}/sun/image?wavelength=193`, {
      method: 'HEAD',
      redirect: 'manual'
    });
    const time5 = Date.now() - start5;
    console.log(`   Response time: ${time5}ms`);
    console.log(`   Status: ${response5.status}`);
    console.log(`   Location header: ${response5.headers.get('location') ? 'Present' : 'Missing'}\n`);

    // Test 6: Test with specific date
    console.log('6. Testing /sun/metadata with specific date:');
    const start6 = Date.now();
    const response6 = await fetch(`${BASE_URL}/sun/metadata?date=2024-01-01&wavelength=171`);
    const data6 = await response6.json();
    const time6 = Date.now() - start6;
    console.log(`   Response time: ${time6}ms`);
    console.log(`   Status: ${response6.status}`);
    if (response6.ok) {
      console.log(`   Image ID: ${data6.id}`);
      console.log(`   Date: ${data6.date}`);
    } else {
      console.log(`   Error: ${data6.message || 'Unknown error'}`);
    }
    console.log();

    // Test 7: Test invalid wavelength
    console.log('7. Testing /sun/metadata with invalid wavelength:');
    const start7 = Date.now();
    const response7 = await fetch(`${BASE_URL}/sun/metadata?wavelength=999`);
    const data7 = await response7.json();
    const time7 = Date.now() - start7;
    console.log(`   Response time: ${time7}ms`);
    console.log(`   Status: ${response7.status} (should be 500)`);
    console.log(`   Error message: ${data7.message}\n`);

    // Test 8: Test screenshot endpoint (small size)
    console.log('8. Testing /sun/screenshot (512x512):');
    const start8 = Date.now();
    const response8 = await fetch(`${BASE_URL}/sun/screenshot?width=512&height=512&wavelength=171`, {
      method: 'HEAD' // Just check headers to avoid downloading
    });
    const time8 = Date.now() - start8;
    console.log(`   Response time: ${time8}ms`);
    console.log(`   Status: ${response8.status}`);
    console.log(`   Content-Type: ${response8.headers.get('content-type')}`);
    console.log(`   Content-Length: ${response8.headers.get('content-length')} bytes\n`);

    // Test 9: Test data sources endpoint
    console.log('9. Testing /sun/datasources:');
    const start9 = Date.now();
    const response9 = await fetch(`${BASE_URL}/sun/datasources`);
    const time9 = Date.now() - start9;
    console.log(`   Response time: ${time9}ms`);
    console.log(`   Status: ${response9.status}`);
    if (response9.ok) {
      const data9 = await response9.json();
      const observatories = Object.keys(data9 || {});
      console.log(`   Observatories available: ${observatories.length}`);
      console.log(`   Example observatory: ${observatories[0]}`);
    } else {
      console.log(`   Error: Failed to fetch data sources`);
    }
    console.log();

    // Test 10: Test caching behavior
    console.log('10. Testing cache behavior with repeated request:');
    const start10a = Date.now();
    await fetch(`${BASE_URL}/sun/metadata?wavelength=211`);
    const time10a = Date.now() - start10a;

    const start10b = Date.now();
    await fetch(`${BASE_URL}/sun/metadata?wavelength=211`);
    const time10b = Date.now() - start10b;

    console.log(`   First request: ${time10a}ms`);
    console.log(`   Second request: ${time10b}ms`);
    console.log(`   Cache effectiveness: ${time10b < time10a ? 'Working' : 'Not cached'}\n`);

    console.log('Sun Image API route testing completed!');

  } catch (error) {
    console.error('Error during testing:', error.message);
    console.error('Make sure the server is running on http://localhost:3102');
  }
}

// Helper function to test if server is running
async function checkServer() {
  try {
    const response = await fetch(BASE_URL);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Main execution
async function main() {
  console.log('Checking if server is running...');
  const serverRunning = await checkServer();

  if (!serverRunning) {
    console.log('❌ Server is not running at http://localhost:3102');
    console.log('Please start the server first with: node server.js');
    process.exit(1);
  }

  console.log('✅ Server is running. Starting tests...\n');
  await testSunRoutes();
}

main().catch(console.error);
