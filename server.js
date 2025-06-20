require('dotenv').config();
const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
require('mongoose-long')(mongoose);
const bodyParser = require('body-parser');
const expressWs = require('express-ws');
const morgan = require('morgan');
const fs = require('fs');

// Khởi tạo express
const app = express();

// Khởi tạo WebSocket cho app
const wsInstance = expressWs(app);

// CORS
app.use(cors({
    origin: '*',
    optionsSuccessStatus: 200
}));

// Body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// View engine
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));

// Kết nối database
const configDB = require('./config/database');
mongoose.set('strictQuery', true);
mongoose.connect(configDB.url, configDB.options)
    .then(() => {
        console.log("✅ Kết nối MongoDB thành công");
        // Chỉ chạy các service khi MongoDB đã kết nối thành công
        initServices();
    })
    .catch(err => {
        console.error("❌ Lỗi kết nối MongoDB:", err.message);
    });

// Khi MongoDB kết nối thành công, mới load toàn bộ hệ thống
function initServices() {
    // Cấu hình dữ liệu mặc định
    require('./config/admin')();

    // Khởi tạo websocket
    const redT = wsInstance.getWss();  // đây mới đúng
    process.redT = redT;
    global['redT'] = redT;
    global['userOnline'] = 0;

    // Khởi tạo socket & routes
    require('./app/Helpers/socketUser')(redT);
    require('./routerHttp')(app, redT);
    require('./routerCMS')(app, redT);
    require('./routerSocket')(app, redT);
    require('./app/Cron/taixiu')(redT);
    require('./app/Cron/baucua')(redT);
    require('./config/cron')();

    // Server listen
    const port = process.env.PORT || 4000;
    app.listen(port, () => {
        console.log("✅ Server đang chạy tại cổng:", port);
    });
}
