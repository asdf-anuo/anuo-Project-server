// 在这里封装项目需要的公共函数
// 判断是否登录
exports.checkIsLogin = function(username, res, callback) {
  if (username) {
    callback(); // 已经登录进行 callback 操作
  } else {
    res.send(
      `<script>window.alert('当前处于未登录状态,请重新登录');location.href='/login' </script>`
    );
  }
};

exports.setError = function(err, res, db) {
  if (err) {
    res.json({
      errMsg: "数据库错误",
      code: 500,
      type: 0
    });
    throw err;
    db.close();
  }
};

exports.dateForMate = function(date) {
  var time = new Date(date);
  var year = time.getFullYear();
  var month = time.getMonth() + 1;
  var day = time.getDate();

  var hour = time.getHours();
  var min = time.getMinutes();
  var sec = time.getSeconds();

  return `${year}-${month}-${day} ${hour}:${min}:${sec}`;
};

var crypto = require("crypto"); //node 模块

// 加密函数  data  需要加密的明文 key
function aesEncrypt(data, key) {
  const cipher = crypto.createCipher("aes192", key);
  var crypted = cipher.update(data, "utf8", "hex");
  crypted += cipher.final("hex");
  return crypted;
}

// 解密  encrypted  加密后文件   key 秘钥
function aesDecrypt(encrypted, key) {
  const decipher = crypto.createDecipher("aes192", key);
  var decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// daydayup   daydayup + wuhan1810
exports.aesEncrypt = aesEncrypt; // 加密
exports.aesDecrypt = aesDecrypt; // 解密
exports.keys = "wuhan1810"; // 密钥
