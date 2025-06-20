// Import các module
let Helpers     = require('../Helpers/Helpers');
let UserInfo    = require('../Models/UserInfo');
let TXPhien     = require('../Models/TaiXiu_phien');
let TXCuoc      = require('../Models/TaiXiu_cuoc');
let TaiXiu_User = require('../Models/TaiXiu_user');
let TXCuocOne   = require('../Models/TaiXiu_one');
let TopVip      = require('../Models/VipPoint/TopVip');
let TXBotChat   = require('../Models/TaiXiu_bot_chat');
let HU_game     = require('../Models/HU');
let bot         = require('./taixiu/bot');
let botHu       = require('./bot_hu');

let io = null;
let gameLoop = null;
let botList = [];
let botListChat = [];
let botTemp = [];
let _tops = [];

function getIndex(arr, name){
  for(let i=0; i< arr.length ;i++){
    if(arr[i]['name'] == name){
      return i+1;
    }
  }
  return 0;
}

let topUser = function(){
  TaiXiu_User.find({'totall':{$gt:0}}, 'totall uid', {sort:{totall:-1}, limit:10}, function(err, results) {
    if (Array.isArray(results) && results.length) {
      Promise.all(results.map(obj => {
        return new Promise((resolve) => {
          UserInfo.findOne({'id': obj.uid}, function(error, result2){
            resolve({name: result2 ? result2.name : ''});
          })
        });
      })).then(function(result){
        _tops = result;
        io.top = _tops;
      });
    }
  });
};

let botchatRun = function(){
  let time = 0;
  let botChat = setInterval(function(){
    let _time = 2000 * parseFloat((Math.random() * (0.9 - 0.3) + 0.5).toFixed(4));
    if(time == 0 || (Date.now() - time) >= _time){
      Helpers.shuffle(botListChat);
      if(botListChat.length > 1){
        TXBotChat.aggregate([{ $sample: { size: 1 } }]).exec(function(err, chatText){
          if(chatText.length){
            Object.values(io.users).forEach(users => {
              users.forEach(client => {
                let content = { taixiu: { chat: { message: { user: botListChat[0].name, value: chatText[0].Content, top:getIndex(_tops,botListChat[0].name)} } } };
                client.red(content);
              });
            });
          }
        });
      }
      time = Date.now();
    }
  },500);
  return botChat;
};

let truChietKhau = function(bet, phe){
  return bet - Math.ceil(bet * phe / 100);
}

let TopHu = function(){
  HU_game.find({}, 'game type red bet toX balans x').exec(function(err, data){
    if (data.length) {
      let result = data.map(obj => {
        obj = obj._doc;
        delete obj._id;
        return obj;
      });
      let temp_data = { TopHu: {
        mini_poker: result.filter(g => g.game === 'minipoker'),
        big_babol: result.filter(g => g.game === 'bigbabol'),
        vq_red: result.filter(g => g.game === 'vuongquocred'),
        caothap: result.filter(g => g.game === 'caothap'),
        arb: result.filter(g => g.game === 'arb'),
        candy: result.filter(g => g.game === 'candy'),
        long: result.filter(g => g.game === 'long'),
        zeus: result.filter(g => g.game === 'Zeus'),
        megaj: result.filter(g => g.game === 'megaj')
      }};
      io.broadcast(temp_data);
    }
  });
}

let playGame = function(){
  io.TaiXiu_time = 77;
  gameLoop = setInterval(function(){
    if (!(io.TaiXiu_time % 5)) TopHu();
    io.TaiXiu_time--;

    if (io.TaiXiu_time == 5) {
      let home;
      if (io.taixiu.taixiu.red_tai > io.taixiu.taixiu.red_xiu) {
        io.taixiu.taixiu.red_tai = io.taixiu.taixiu.red_xiu;
        home = {taixiu:{taixiu:{red_tai: io.taixiu.taixiu.red_tai, red_xiu: io.taixiu.taixiu.red_xiu},err: 'Đang cân cửa'}};
      } else {
        io.taixiu.taixiu.red_xiu = io.taixiu.taixiu.red_tai;
        home = {taixiu:{taixiu:{red_tai: io.taixiu.taixiu.red_tai, red_xiu: io.taixiu.taixiu.red_xiu},err: 'Đang cân cửa'}};
      }
      Object.values(io.users).forEach(users => {
        users.forEach(client => {
          client.red(home);
        });
      });
    }

    if (io.TaiXiu_time < 0) {
      clearInterval(gameLoop);
      io.TaiXiu_time = 0;
      let taixiujs = Helpers.getData('taixiu');
      if (!!taixiujs) {
        let dice1 = parseInt(taixiujs.dice1 == 0 ? Math.floor(Math.random() * 6) + 1 : taixiujs.dice1);
        let dice2 = parseInt(taixiujs.dice2 == 0 ? Math.floor(Math.random() * 6) + 1 : taixiujs.dice2);
        let dice3 = parseInt(taixiujs.dice3 == 0 ? Math.floor(Math.random() * 6) + 1 : taixiujs.dice3);
        taixiujs.dice1 = taixiujs.dice2 = taixiujs.dice3 = 0;
        Helpers.setData('taixiu', taixiujs);
        TXPhien.create({'dice1':dice1, 'dice2':dice2, 'dice3':dice3, 'time':new Date()}, function(err, create){
          if (!!create) {
            io.TaiXiu_phien = create.id+1;
            io.sendAllUser({taixiu: {finish:{dices:[create.dice1, create.dice2, create.dice3], phien:create.id}}});
            Object.values(io.admins).forEach(admin => {
              admin.forEach(client => {
                client.red({taixiu: {finish:{dices:[create.dice1, create.dice2, create.dice3], phien:create.id}}});
              });
            });
          }
        });
      }
      io.taixiu = { taixiu: { red_player_tai: 0, red_player_xiu: 0, red_tai: 0, red_xiu: 0 } };
      io.taixiuAdmin = { taixiu: { red_player_tai: 0, red_player_xiu: 0, red_tai: 0, red_xiu: 0 }, list: [] };
      topUser();
      let taixiucf = Helpers.getConfig('taixiu');
      if (!!taixiucf && taixiucf.bot && !!io.listBot && io.listBot.length > 0) {
        botTemp = [...io.listBot];
        botList = [...io.listBot];
        let maxBot = (botList.length*100/100)>>0;
        botList = Helpers.shuffle(botList).slice(0, maxBot);
        botListChat = botTemp;
      } else {
        botTemp = [];
        botList = [];
        botListChat = [];
      }
    } else {
      if (!!botList.length && io.TaiXiu_time > 5) {
        let userCuoc = ((Math.random()*10)>>0);
        for (let iH = 0; iH < userCuoc; iH++) {
          let dataT = botList[iH];
          if (!!dataT) {
            bot.tx(dataT, io);
            botList.splice(iH, 1);
          }
        }
      }
    }
    botHu(io, botTemp);
  }, 1000);
  return gameLoop;
}

let init = function(obj){
  io = obj;
  io.listBot = [];

  UserInfo.find({type:true}, 'id name', function(err, list){
    if (!!list && list.length) {
      io.listBot = list.map(user => {
        user = user._doc;
        delete user._id;
        return user;
      });
    }
  });

  TXPhien.findOne({}, 'id', {sort:{'id':-1}}, function(err, last) {
    if (!!last){
      io.TaiXiu_phien = last.id+1;
    }
  });

  io.taixiu = { taixiu: { red_player_tai: 0, red_player_xiu: 0, red_tai: 0, red_xiu: 0 } };
  io.taixiuAdmin = { taixiu: { red_player_tai: 0, red_player_xiu: 0, red_tai: 0, red_xiu: 0 }, list: [] };
  
  topUser();
  playGame();
  botchatRun();
}

module.exports = init;
