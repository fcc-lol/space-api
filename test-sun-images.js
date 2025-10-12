import {
  getSunImageMetadata,
  getSunImageUrl,
  getSunImage,
  getSunScreenshot,
  getSunDataSources,
  getAvailableWavelengths,
  getWavelengthDescription
} from './modules/sunImages.js';

async function testSunImagesModule() {
  console.log('Testing Sun Images module...\n');

  try {
    // Test 1: Get available wavelengths
    console.log('1. Testing available wavelengths:');
    const wavelengths = getAvailableWavelengths();
    console.log(`   Available wavelengths: ${wavelengths.join(', ')}`);
    console.log(`   Total wavelengths: ${wavelengths.length}\n`);

    // Test 2: Get wavelength descriptions
    console.log('2. Testing wavelength descriptions:');
    console.log(`   171: ${getWavelengthDescription('171')}`);
    console.log(`   304: ${getWavelengthDescription('304')}`);
    console.log(`   magnetogram: ${getWavelengthDescription('magnetogram')}\n`);

    // Test 3: Get latest sun image metadata
    console.log('3. Getting latest sun image metadata (171 Å):');
    const start1 = Date.now();
    const metadata = await getSunImageMetadata('latest', '171');
    const time1 = Date.now() - start1;
    console.log(`   Response time: ${time1}ms`);
    console.log(`   Image ID: ${metadata?.id}`);
    console.log(`   Date: ${metadata?.date}`);
    console.log(`   Wavelength: ${metadata?.wavelength}`);
    console.log(`   Width: ${metadata?.width}px`);
    console.log(`   Height: ${metadata?.height}px\n`);

    // Test 4: Get sun image URL
    console.log('4. Getting sun image URL (193 Å):');
    const start2 = Date.now();
    const imageUrl = await getSunImageUrl('latest', '193');
    const time2 = Date.now() - start2;
    console.log(`   Response time: ${time2}ms`);
    console.log(`   Image URL: ${imageUrl}\n`);

    // Test 5: Get sun image metadata for different wavelength
    console.log('5. Getting sun image metadata (304 Å):');
    const start3 = Date.now();
    const metadata304 = await getSunImageMetadata('latest', '304');
    const time3 = Date.now() - start3;
    console.log(`   Response time: ${time3}ms`);
    console.log(`   Image ID: ${metadata304?.id}`);
    console.log(`   Date: ${metadata304?.date}`);
    console.log(`   Wavelength: ${metadata304?.wavelength}\n`);

    // Test 6: Test with specific date
    console.log('6. Getting sun image metadata for specific date (2024-01-01):');
    try {
      const start4 = Date.now();
      const metadataDate = await getSunImageMetadata('2024-01-01T12:00:00Z', '171');
      const time4 = Date.now() - start4;
      console.log(`   Response time: ${time4}ms`);
      console.log(`   Image ID: ${metadataDate?.id}`);
      console.log(`   Date: ${metadataDate?.date}`);
      console.log(`   Wavelength: ${metadataDate?.wavelength}\n`);
    } catch (error) {
      console.log(`   Error: ${error.message}\n`);
    }

    // Test 7: Test invalid wavelength
    console.log('7. Testing invalid wavelength:');
    try {
      await getSunImageMetadata('latest', '999');
    } catch (error) {
      console.log(`   Expected error: ${error.message}\n`);
    }

    // Test 8: Get data sources (this might be slow)
    console.log('8. Getting sun data sources:');
    try {
      const start5 = Date.now();
      const dataSources = await getSunDataSources();
      const time5 = Date.now() - start5;
      console.log(`   Response time: ${time5}ms`);
      console.log(`   Data sources retrieved: ${Object.keys(dataSources || {}).length > 0 ? 'Yes' : 'No'}\n`);
    } catch (error) {
      console.log(`   Error getting data sources: ${error.message}\n`);
    }

    // Test 9: Test screenshot functionality (smaller size for testing)
    console.log('9. Testing sun screenshot (512x512):');
    try {
      const start6 = Date.now();
      const screenshot = await getSunScreenshot('latest', '171', 512, 512);
      const time6 = Date.now() - start6;
      console.log(`   Response time: ${time6}ms`);
      console.log(`   Screenshot size: ${screenshot.byteLength} bytes\n`);
    } catch (error) {
      console.log(`   Error taking screenshot: ${error.message}\n`);
    }

    // Test 10: Test actual image download (commented out by default as it's large)
    console.log('10. Testing actual image download (skipped by default):');
    console.log('   Uncomment the code below to test actual image download\n');
    /*
    try {
      const start7 = Date.now();
      const imageData = await getSunImage('latest', '171');
      const time7 = Date.now() - start7;
      console.log(`   Response time: ${time7}ms`);
      console.log(`   Image size: ${imageData.byteLength} bytes`);
    } catch (error) {
      console.log(`   Error downloading image: ${error.message}`);
    }
    */

    console.log('Sun Images module testing completed successfully!');

  } catch (error) {
    console.error('Error during testing:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testSunImagesModule().catch(console.error);
