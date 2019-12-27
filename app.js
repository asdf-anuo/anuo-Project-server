var express = require("express");

var app = express();

const hostname = "0.0.0.0";
const port = 1810;

var vueRouter = require("./vue");
var reactRouter = require("./react");
var wechatRouter = require("./wechat");

app.use(express.json()); //处理POST请求 提交body参数 req.body
app.use(
  express.urlencoded({
    extended: false
  })
); // form method = "POST"

//处理跨域方法 CORS 处理方式
app.all("*", function(req, res, next) {
  // res.header("Access-Control-Allow-Headers","Access-Control-Allow-Headers")
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With,Content-Type");
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  res.header("X-Powered-By", " 3.2.1");
  next();
});

app.all("/all", (req, res) => {
  res.send("这是来自 get & post 的请求~");
});

app.get("/index", (req, res) => {
  res.json({
    code: 200,
    type: 1,
    msg: "这是我的后端服务器接口~"
  });
});

app.use("/vue", vueRouter);
app.use("/react", reactRouter);
app.use("/wechat", wechatRouter);

app.listen(port, hostname, () => {
  console.log(`my server is running at http://${hostname}:${port}`);
});
