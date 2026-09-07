const https = require('https');

const data = JSON.stringify({ device_id: '5dcbb4d5d81dab1c' });

const options = {
  hostname: 'aplicativo.grandmidia.com.br',
  port: 443,
  path: '/api.php',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log(body));
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
