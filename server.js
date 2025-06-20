// 📦 Full sạch backend game Tài Xỉu cho bạn
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');

const configDB = require('./config/database');

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(session({ secret: 'super_secret_key', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Kết nối MongoDB Atlas
mongoose.connect(configDB.url, configDB.options)
  .then(() => console.log('✅ Đã kết nối MongoDB thành công'))
  .catch(err => console.error('❌ Lỗi kết nối MongoDB:', err));

// Tải cấu hình passport nếu có
// require('./config/passport')(passport);

// Import routes game Tài Xỉu
require('./routes/user.routes')(app, passport);
require('./routes/game.routes')(app);
require('./routes/admin.routes')(app);

// Test server sống
app.get('/', (req, res) => {
  res.send('<h1>Server Tài Xỉu đang hoạt động ✅</h1>');
});

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại cổng ${PORT}`);
});
