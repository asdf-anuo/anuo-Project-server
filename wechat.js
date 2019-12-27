var express = require("express");
var router = express.Router();
var { conn } = require("./utils/db3");
var { setError } = require("./utils/index");
var { ObjectID } = require("mongodb");
var { waterfall } = require("async");

router.get("/index", (req, res) => {
  res.json({
    code: 200,
    msg: "anuo-wechat-project 后端接口地址"
  });
});

//get 注册
router.get("/register", (req, res) => {
  var body = req.query;
  console.log("body");
  console.log(body);

  var username = req.query.username;
  var usertel = req.query.usertel;
  conn((err, db) => {
    // 判断输入的username是否存在
    // 存在 给提示
    // 不存在 插入数据
    if (err) throw err;
    var userinfo = db.collection("userinfo");
    waterfall(
      [
        cb => {
          //查询是否已经被注册过
          userinfo.findOne(
            {
              $or: [
                {
                  username
                },
                {
                  usertel
                }
              ]
            },
            (err, result) => {
              if (err) {
                cb(err, null);
              } else {
                if (result) {
                  cb(null, true); //已被注册
                } else {
                  cb(null, false); //未被注册
                }
              }
            }
          );
        },
        (args, cb) => {
          if (!args) {
            //没有被注册 插入数据 并且提示注册成功
            userinfo.insertOne(body, (err, result) => {
              if (err) {
                cb(err, null);
              } else {
                cb(null, {
                  result,
                  code: 200,
                  type: 1,
                  msg: "恭喜你,注册成功lalala"
                });
              }
            });
          } else {
            //已被注册 提示用户
            cb(null, {
              code: 204,
              type: 0,
              msg: "用户名或手机号已存在!"
            });
          }
        }
      ],
      (err, result) => {
        if (err) throw err;
        // console.log(result);
        res.json({
          result
        });
      }
    );
  });
});

//get 登录
router.get("/login", (req, res) => {
  var body = req.query;
  console.log(body);
  conn((err, db) => {
    setError(err, res, db);
    //定义函数
    var findData = (db, cb) => {
      db.collection("userinfo").findOne(
        {
          $or: [
            {
              username: body.loginName,
              password: body.password
            },
            {
              usertel: body.loginName,
              password: body.password
            }
          ]
        },
        (err, result) => {
          setError(err, res, db);
          cb(result);
        }
      );
    };
    //执行函数
    findData(db, result => {
      console.log(result);
      if (result) {
        res.json({
          code: 200,
          msg: "success"
        });
      } else {
        //登录失败
        res.json({
          code: 204,
          msg: "用户名或者密码错误,请重新登录!"
        });
      }
      db.close();
    });
  });
});

//获取 all goods info
router.get("/allgoods", (req, res) => {
  let limit = req.query.limit * 1 || 0;
  conn((err, db) => {
    setError(err, res, db);
    db.collection("goodsinfo")
      .find({}, {})
      .sort({
        _id: -1
      })
      .limit(limit)
      .toArray((err, result) => {
        setError(err, res, db);
        res.json({
          result,
          code: 200,
          msg: "获取 all 信息 成功"
        });
        db.close();
      });
  });
});

//获取 all types
router.get("/getTypes", (req, res) => {
  // let limit = req.query.limit * 1 || 0;
  conn((err, db) => {
    setError(err, res, db);
    db.collection("goodsinfo").distinct("goods_brand_name", (err, result) => {
      setError(err, res, db);
      res.json({
        result,
        code: 200,
        msg: "获取 分类 成功"
      });
      db.close();
    });
  });
});

//获取 goods by type
router.get("/allGoodsByType", (req, res) => {
  let limit = req.query.limit * 1 || 0;
  let goods_brand_name = req.query.type;
  conn((err, db) => {
    setError(err, res, db);
    db.collection("goodsinfo")
      .find({ goods_brand_name }, {})
      .sort({
        _id: -1
      })
      .limit(limit)
      .toArray((err, result) => {
        setError(err, res, db);
        res.json({
          result,
          code: 200,
          msg: "获取 all 信息 成功"
        });
        db.close();
      });
  });
});

//获取 goods by keyword
router.get("/allGoodsByKeyword", (req, res) => {
  let limit = req.query.limit * 1 || 0;
  let keyword = req.query.keyword;
  conn((err, db) => {
    setError(err, res, db);
    db.collection("goodsinfo")
      .find({
        $or: [{
          goods_name: new RegExp(keyword)
        },
        {
          goods_brand_name: new RegExp(keyword)
        }
      ]
      }, {})
      .sort({
        _id: -1
      })
      .limit(limit)
      .toArray((err, result) => {
        setError(err, res, db);
        res.json({
          result,
          code: 200,
          msg: "获取 goods by keyword  成功"
        });
        db.close();
      });
  });
});

// 获取 good-detail  by _id
router.get("/getDetail", (req, res) => {
  var _id = req.query.id;
  conn((err, db) => {
    setError(err, res, db);
    db.collection("goodsinfo").findOne(
      {
        _id
      },
      (err, result) => {
        setError(err, res, db);
        res.json({
          result,
          code: 200,
          msg: "获取 商品 详情 成功"
        });
        db.close();
      }
    );
  });
});

// 加入购物车
router.get("/addToMyshopcar", (req, res) => {
  const query = req.query;
  console.log(query);

  conn((err, db) => {
    setError(err, res, db);
    var myshopcar = db.collection("myshopcar");
    waterfall(
      [
        callback => {
          myshopcar.findOne(
            { username: query.username, goodId: query.goodId },
            (err, result) => {
              console.log(result);
              callback(err, result);
            }
          );
        },
        (args, callback) => {
          if (!args) {
            //如果不存在  就第一次插入数据
            query.enterTime = new Date();
            query.count = query.count * 1;
            myshopcar.insert(query, (err, result) => {
              callback(err, { msg: "成功添加到购物车", code: 200 });
            });
          } else {
            // 如果存在 就更新数据
            myshopcar.update(
              {
                username: query.username,
                goodId: query.goodId
              },
              {
                $inc: { count: query.count * 1 },
                $set: { enterTime: new Date() }
              },
              (err, result) => {
                callback(err, { msg: "购物车数量更新成功", code: 200 });
              }
            );
          }
        }
      ],
      (err, result) => {
        setError(err, res, db);
        res.json(result);
        db.close();
      }
    );
  });
});

//查询购物车
router.get("/getCarList", (req, res) => {
  let username = req.query.username;
  conn((err, db) => {
    setError(err, res, db);
    db.collection("myshopcar")
      .find({ username }, {})
      .sort({ _id: -1 })
      .toArray((err, result) => {
        setError(err, res, db);
        res.json({
          msg: "成功获取购物车商品",
          code: 200,
          result
        });
        db.close();
      });
  });
});

//删除购物车
//修改购物车
module.exports = router;
