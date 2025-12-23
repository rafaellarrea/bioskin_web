import https from 'https';

const url = 'https://saludbioskin.vercel.app/api/search?action=health';

console.log(`Testing URL: ${url}`);

const req = https.get(url, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log('Headers:', res.headers);

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\n--- Response Body ---');
    console.log(data);
    console.log('---------------------');
    
    if (res.statusCode >= 400) {
        console.error("❌ API Request Failed");
    } else {
        try {
            JSON.parse(data);
            console.log("✅ Valid JSON received");
        } catch (e) {
            console.error("❌ Response is NOT valid JSON");
        }
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Request Error: ${e.message}`);
});
