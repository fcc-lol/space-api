import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3102';

async function sunImagesExample() {
  console.log('🌞 Sun Images API Example\n');

  try {
    // 1. Get available wavelengths
    console.log('📋 1. Getting available solar wavelengths...');
    const wavelengthsResponse = await fetch(`${BASE_URL}/sun/wavelengths`);
    const wavelengthsData = await wavelengthsResponse.json();

    console.log(`Available wavelengths: ${wavelengthsData.available_wavelengths.join(', ')}`);
    console.log(`Total options: ${wavelengthsData.available_wavelengths.length}\n`);

    // Show descriptions for some popular wavelengths
    const popularWavelengths = ['171', '304', '193', 'magnetogram'];
    console.log('Popular wavelengths and their uses:');
    wavelengthsData.wavelength_info
      .filter(w => popularWavelengths.includes(w.wavelength))
      .forEach(w => console.log(`  ${w.wavelength}: ${w.description}`));
    console.log();

    // 2. Get latest sun image metadata for different wavelengths
    console.log('🔍 2. Getting sun image metadata for different wavelengths...');

    const testWavelengths = ['171', '304', '193'];
    for (const wavelength of testWavelengths) {
      const metadataResponse = await fetch(`${BASE_URL}/sun/metadata?wavelength=${wavelength}`);
      const metadata = await metadataResponse.json();

      if (metadata.id) {
        console.log(`${wavelength}Å: Image ID ${metadata.id}, Date: ${metadata.date}, Size: ${metadata.width}x${metadata.height}px`);
      } else {
        console.log(`${wavelength}Å: No recent image available`);
      }
    }
    console.log();

    // 3. Get a specific sun image URL
    console.log('🔗 3. Getting sun image URL for 171Å (Quiet corona)...');
    const imageUrlResponse = await fetch(`${BASE_URL}/sun/imageurl?wavelength=171`);
    const imageUrlData = await imageUrlResponse.json();
    console.log(`Direct image URL: ${imageUrlData.url}`);
    console.log();

    // 4. Demonstrate date-specific requests
    console.log('📅 4. Getting sun image for a specific date...');
    try {
      const specificDateResponse = await fetch(`${BASE_URL}/sun/metadata?date=2024-01-01&wavelength=304`);
      const specificDateData = await specificDateResponse.json();

      if (specificDateResponse.ok && specificDateData.id) {
        console.log(`Found image for 2024-01-01: ID ${specificDateData.id}, actual date: ${specificDateData.date}`);
      } else {
        console.log(`No exact match for 2024-01-01, API found closest available image`);
      }
    } catch (error) {
      console.log(`Error getting specific date: ${error.message}`);
    }
    console.log();

    // 5. Generate a custom screenshot
    console.log('📸 5. Generating custom sun screenshot (512x512, 171Å)...');
    const screenshotUrl = `${BASE_URL}/sun/screenshot?width=512&height=512&wavelength=171`;

    try {
      const screenshotResponse = await fetch(screenshotUrl);
      if (screenshotResponse.ok) {
        const screenshotBuffer = await screenshotResponse.arrayBuffer();

        // Save screenshot to examples directory
        const screenshotPath = path.join('examples', 'sun_screenshot_171.png');
        fs.writeFileSync(screenshotPath, Buffer.from(screenshotBuffer));

        console.log(`✅ Screenshot saved: ${screenshotPath}`);
        console.log(`Size: ${screenshotBuffer.byteLength} bytes`);
      } else {
        console.log(`❌ Screenshot failed: ${screenshotResponse.status} ${screenshotResponse.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Screenshot error: ${error.message}`);
    }
    console.log();

    // 6. Compare different wavelengths for the same time
    console.log('🌈 6. Comparing different solar wavelengths for the same time...');
    const compareWavelengths = ['171', '304', '193', '211'];
    const comparisonData = [];

    for (const wavelength of compareWavelengths) {
      const response = await fetch(`${BASE_URL}/sun/metadata?wavelength=${wavelength}`);
      const data = await response.json();

      if (data.id) {
        comparisonData.push({
          wavelength,
          imageId: data.id,
          date: data.date,
          description: wavelengthsData.wavelength_info.find(w => w.wavelength === wavelength)?.description || 'Unknown'
        });
      }
    }

    console.log('Latest images by wavelength:');
    comparisonData.forEach(item => {
      console.log(`  ${item.wavelength}Å: ${item.date} (ID: ${item.imageId})`);
      console.log(`    Purpose: ${item.description.split(' (')[0]}`);
    });
    console.log();

    // 7. Get data sources information
    console.log('🛰️ 7. Getting available data sources...');
    try {
      const dataSourcesResponse = await fetch(`${BASE_URL}/sun/datasources`);
      if (dataSourcesResponse.ok) {
        const dataSources = await dataSourcesResponse.json();
        const observatories = Object.keys(dataSources);

        console.log(`Available observatories: ${observatories.join(', ')}`);

        // Show details for SDO if available
        if (dataSources.SDO) {
          const sdoInstruments = Object.keys(dataSources.SDO);
          console.log(`SDO instruments: ${sdoInstruments.join(', ')}`);
        }
      } else {
        console.log('❌ Could not fetch data sources');
      }
    } catch (error) {
      console.log(`❌ Data sources error: ${error.message}`);
    }
    console.log();

    // 8. Performance comparison: cached vs non-cached
    console.log('⚡ 8. Testing cache performance...');

    // First request (cache miss)
    const start1 = Date.now();
    await fetch(`${BASE_URL}/sun/metadata?wavelength=211`);
    const time1 = Date.now() - start1;

    // Second request (cache hit)
    const start2 = Date.now();
    await fetch(`${BASE_URL}/sun/metadata?wavelength=211`);
    const time2 = Date.now() - start2;

    console.log(`First request (cache miss): ${time1}ms`);
    console.log(`Second request (cache hit): ${time2}ms`);
    console.log(`Performance improvement: ${Math.round(((time1 - time2) / time1) * 100)}%`);
    console.log();

    console.log('✅ Sun Images API example completed successfully!');
    console.log('\n📝 Summary:');
    console.log('- Available wavelengths retrieved');
    console.log('- Image metadata fetched for multiple wavelengths');
    console.log('- Direct image URLs obtained');
    console.log('- Custom screenshot generated and saved');
    console.log('- Data sources information retrieved');
    console.log('- Cache performance demonstrated');

  } catch (error) {
    console.error('❌ Error during sun images example:', error.message);
    console.log('\n🔧 Make sure:');
    console.log('1. The server is running: node server.js');
    console.log('2. The server is accessible at http://localhost:3102');
    console.log('3. You have an internet connection for API calls');
  }
}

// Helper function to demonstrate error handling
async function demonstrateErrorHandling() {
  console.log('\n🚨 Error Handling Examples:');

  try {
    // Test invalid wavelength
    console.log('Testing invalid wavelength...');
    const invalidResponse = await fetch(`${BASE_URL}/sun/metadata?wavelength=999`);
    const invalidData = await invalidResponse.json();
    console.log(`Expected error: ${invalidData.message}`);

    // Test invalid date format
    console.log('Testing invalid date format...');
    const invalidDateResponse = await fetch(`${BASE_URL}/sun/metadata?date=invalid-date`);
    const invalidDateData = await invalidDateResponse.json();
    console.log(`Date error handled: ${invalidDateResponse.status >= 400 ? 'Yes' : 'No'}`);

  } catch (error) {
    console.log(`Error handling working: ${error.message}`);
  }
}

// Main execution
async function main() {
  console.log('🌞 Starting Sun Images API Example...\n');

  // Check if server is running
  try {
    const healthCheck = await fetch(BASE_URL);
    if (!healthCheck.ok) {
      throw new Error('Server not responding');
    }
  } catch (error) {
    console.error('❌ Cannot connect to server at http://localhost:3102');
    console.log('Please start the server with: node server.js');
    return;
  }

  await sunImagesExample();
  await demonstrateErrorHandling();

  console.log('\n🎉 Example completed! Check the examples/ directory for saved screenshots.');
}

// Run the example
main().catch(console.error);
