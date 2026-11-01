const http = require('http');

const data = JSON.stringify({ email: 'customer@demo.com', password: 'password123' });

const req = http.request({ hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': data.length } }, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const json = JSON.parse(body);
    const token = json.token;
    
    // Now trigger analyze on the previous id
    const cmpReq = http.request({
      hostname: 'localhost', port: 5000, path: '/api/complaints/6abe43c9afcf1f8b5979e14a/analyze', method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Length': 0 }
    }, cmpRes => {
      let cmpBody = '';
      cmpRes.on('data', d => cmpBody += d);
      cmpRes.on('end', () => { console.log("Analyze:", cmpBody); });
    });
    cmpReq.end();
  });
});
req.write(data);
req.end();
