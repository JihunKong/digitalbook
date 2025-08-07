const express = require('express');
const app = express();
const PORT = 80;

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>한국어 디지털 교과서 플랫폼</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
          background: #f5f5f5;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #333; margin-bottom: 20px; }
        .status { 
          background: #10b981; 
          color: white; 
          padding: 10px 20px;
          border-radius: 5px;
          display: inline-block;
          margin-bottom: 20px;
        }
        .info { margin: 20px 0; line-height: 1.6; }
        .info strong { color: #6366f1; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎓 한국어 디지털 교과서 플랫폼</h1>
        <div class="status">✅ 서버가 정상적으로 실행 중입니다</div>
        <div class="info">
          <p><strong>도메인:</strong> xn--220bu63c.com</p>
          <p><strong>서버 IP:</strong> 43.203.208.204</p>
          <p><strong>상태:</strong> 배포 완료</p>
          <p><strong>시간:</strong> ${new Date().toLocaleString('ko-KR')}</p>
        </div>
        <p>Docker 빌드가 완료되면 전체 애플리케이션이 실행됩니다.</p>
      </div>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다`);
});