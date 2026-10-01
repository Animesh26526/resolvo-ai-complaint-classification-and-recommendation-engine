const http = require('http');

const data = JSON.stringify({
  email: 'customer@demo.com',
  password: 'password123'
});

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const json = JSON.parse(body);
    console.log("Token:", json.token ? "got token" : "no token");
    if (!json.token) { console.log(json); return; }
    
    // Now post complaint
    const cmpData = JSON.stringify({
      description: 'Test issue with product',
      channel: 'direct'
    });
    
    const cmpReq = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/complaints',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': cmpData.length,
        'Authorization': 'Bearer ' + json.token
      }
    }, cmpRes => {
      let cmpBody = '';
      cmpRes.on('data', d => cmpBody += d);
      cmpRes.on('end', () => {
        console.log("Create complaint:", cmpBody);
      });
    });
    cmpReq.write(cmpData);
    cmpReq.end();
  });
});
req.write(data);
req.end();
