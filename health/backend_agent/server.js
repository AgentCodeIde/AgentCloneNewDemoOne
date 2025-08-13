// server.js

// 1. Import thư viện express
const express = require('express');

// 2. Khởi tạo một ứng dụng express
const app = express();

// 3. Định nghĩa cổng mà server sẽ chạy
const PORT = 3000;

// 4. Tạo một route (tuyến đường) đơn giản
// Khi người dùng truy cập vào trang chủ ('/'), server sẽ trả về "Hello World!"
// ví dụ trong server chính:
app.get('/health', (req, res) => {
  res.status(200).json({ ok: true, ts: Date.now() });
});

// 5. Lắng nghe các yêu cầu trên cổng đã định nghĩa
app.listen(PORT, () => {
  console.log(`Ứng dụng đang chạy trên http://localhost:${PORT}`);
});