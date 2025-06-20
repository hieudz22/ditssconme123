require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');

// Đọc cấu hình database
const configDB = require('./config/database');

// Middleware
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// Kết nối MongoDB qua Mongoose
mongoose.connect(configDB.url, configDB.options)
  .then(() => console.log('✅ Kết nối MongoDB thành công'))
  .catch((err) => console.error('❌ Lỗi kết nối MongoDB:', err));

// Thêm các route của bạn bên dưới
// app.use('/api', require('./routes/api'));

// Cổng chạy server (đọc từ biến môi trường cho Render)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại cổng ${PORT}`);
});
