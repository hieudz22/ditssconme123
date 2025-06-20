// Đoạn code mẫu đầy đủ cho server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// MongoDB Connection
const uri = 'mongodb+srv://tungtung:admindeptrai@ac-zlgw7r1.xsrqoxt.mongodb.net/RedVip?retryWrites=true&w=majority';

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Kết nối MongoDB thành công'))
.catch(err => console.error('❌ Lỗi kết nối MongoDB:', err));

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại cổng ${PORT}`);
});
﻿

let fs 			  = require('fs');
let https     	  = require('https')
let privateKey    = fs.readFileSync('./ssl/b86club.key', 'utf8');
let certificate   = fs.readFileSync('./ssl/b86club.pem', 'utf8');
let credentials   = {key: privateKey, cert: certificate};
let app           = express();
let server 	  	  = https.createServer(credentials, app);
app.use(cors({
    origin: '*',
    optionsSuccessStatus: 200
}));
let port       = process.env.PORT || 80;
// Setting & Connect to the Database
// cấu hình tài khoản admin mặc định và các dữ liệu mặc định
require('./config/admin');
// đọc dữ liệu from
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(morgan('combined'));
app.set('view engine', 'ejs'); // chỉ định view engine là ejs
app.set('views', './views');   // chỉ định thư mục view
// Serve static html, js, css, and image files from the 'public' directory
app.use(express.static('public'));
// server socket
let redT = expressWs.getWss();
process.redT = redT;
global['redT'] = redT;
global['userOnline'] = 0;
require('./app/Helpers/socketUser')(redT); // Add function socket
require('./routerHttp')(app, redT);   // load các routes HTTP
require('./routerCMS')(app, redT);	//load routes CMS
require('./routerSocket')(app, redT); // load các routes WebSocket
require('./app/Cron/taixiu')(redT);   // Chạy game Tài Xỉu
require('./app/Cron/baucua')(redT);   // Chạy game Bầu Cua
require('./config/cron')();

