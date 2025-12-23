import https from 'https';

const urls = [
  'https://saludbioskin.vercel.app/api/records?action=health',
  'https://saludbioskin.vercel.app/api/test-records?action=health'
];

urls.forEach(url => {
  console.log(`Testing URL: ${url}`);

  const req = https.get(url, (res) => {
    console.log(`\n[${url}] Status Code: ${res.statusCode}`);
    console.log(`[${url}] Content-Type: ${res.headers['content-type']}`);

    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log(`\n--- Response Body (${url}) ---`);
      console.log(data.substring(0, 200) + (data.length > 200 ? '...' : ''));
      console.log('---------------------');
      
      if (res.statusCode >= 400) {
          console.error(`❌ [${url}] API Request Failed`);
      } else {
          try {
              JSON.parse(data);
              console.log(`✅ [${url}] Valid JSON received`);
          } catch (e) {
              console.error(`❌ [${url}] Response is NOT valid JSON (Likely HTML fallback)`);
          }
      }
    });
  });

  req.on('error', (e) => {
    console.error(`❌ [${url}] Request Error: ${e.message}`);
  });
});
