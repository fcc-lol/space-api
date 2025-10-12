import {
  getSunImageMetadata,
  getSunImageUrl,
} from './modules/sunImages.js';

async function testDateFormatting() {
  console.log('🧪 Testing Date Formatting for Helioviewer API\n');

  const testCases = [
    'latest',
    '2024-01-01',
    '2024-01-01T12:00:00.000Z',
    '2023-12-15',
    '2023-12-15T00:00:00Z'
  ];

  for (const testDate of testCases) {
    console.log(`Testing date: "${testDate}"`);

    try {
      const start = Date.now();
      const metadata = await getSunImageMetadata(testDate, '171');
      const duration = Date.now() - start;

      if (metadata && metadata.id) {
        console.log(`  ✅ Success (${duration}ms)`);
        console.log(`     Image ID: ${metadata.id}`);
        console.log(`     Actual date: ${metadata.date}`);
        console.log(`     Image URL available: ${metadata.jp2Url ? 'Yes' : 'No'}`);
      } else {
        console.log(`  ❌ No image data returned`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
    console.log();
  }

  // Test URL endpoint specifically
  console.log('🔗 Testing getSunImageUrl function:');
  try {
    const imageUrl = await getSunImageUrl('latest', '171');
    console.log(`  ✅ URL retrieved: ${imageUrl.substring(0, 80)}...`);

    // Test if URL is accessible
    const response = await fetch(imageUrl, { method: 'HEAD' });
    console.log(`  URL status: ${response.status} ${response.statusText}`);
    console.log(`  Content-Type: ${response.headers.get('content-type')}`);

  } catch (error) {
    console.log(`  ❌ URL Error: ${error.message}`);
  }
}

// Helper function to test the exact API call that's failing
async function testDirectApiCall() {
  console.log('\n🌐 Testing Direct Helioviewer API Call:');

  const testDate = new Date().toISOString();
  const sourceId = 10; // AIA 171

  const apiUrl = `https://api.helioviewer.org/v2/getClosestImage/?date=${testDate}&sourceId=${sourceId}`;

  console.log(`API URL: ${apiUrl}`);

  try {
    const response = await fetch(apiUrl);
    console.log(`Response status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
  } catch (error) {
    console.log(`Fetch error: ${error.message}`);
  }
}

// Test different date formats directly against the API
async function testApiDateFormats() {
  console.log('\n📅 Testing Different Date Formats Against API:');

  const sourceId = 10; // AIA 171
  const baseUrl = 'https://api.helioviewer.org/v2/getClosestImage/';

  const dateFormats = [
    new Date().toISOString(),
    '2024-01-01T12:00:00.000Z',
    '2024-01-01T00:00:00.000Z',
    '2023-12-15T12:00:00.000Z'
  ];

  for (const dateStr of dateFormats) {
    console.log(`\nTesting date format: ${dateStr}`);
    const url = `${baseUrl}?date=${dateStr}&sourceId=${sourceId}`;

    try {
      const response = await fetch(url);
      console.log(`  Status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        if (data.id) {
          console.log(`  ✅ Success - Image ID: ${data.id}`);
          console.log(`  Actual date: ${data.date}`);
        } else {
          console.log(`  ⚠️ No image ID in response`);
        }
      } else {
        const errorText = await response.text();
        console.log(`  ❌ Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`  ❌ Fetch error: ${error.message}`);
    }
  }
}

async function main() {
  await testDateFormatting();
  await testDirectApiCall();
  await testApiDateFormats();
}

main().catch(console.error);
