// server.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

const app = express();
const httpsPort = 3000;
const httpPort = 3001; // HTTP 포트 (리디렉션용)

// SSL 인증서 경로 (key.pem, cert.pem)
const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, 'cert', 'server-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert', 'server-cert.pem'))
};

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// 라우트 설정
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// HTTPS 서버 실행
https.createServer(sslOptions, app).listen(httpsPort, () => {
    console.log(`Frontend server is running on https://localhost:${httpsPort}`);
});

// HTTP 요청을 HTTPS로 리디렉션
http.createServer((req, res) => {
    res.writeHead(301, { "Location": `https://localhost:${httpsPort}${req.url}` });
    res.end();
}).listen(httpPort, () => {
    console.log(`HTTP server is running on http://localhost:${httpPort} (Redirecting to HTTPS)`);
});




// // server.js
// const express = require('express');
// const path = require('path');
//
// const app = express();
// const port = 3000;
//
// app.use(express.static(path.join(__dirname, 'public')));
//
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });
//
// app.listen(port, () => {
//     console.log(`Frontend server is running on http://localhost:${port}`);
// });