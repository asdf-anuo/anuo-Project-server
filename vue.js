var express = require("express");
var router = express.Router();

var { conn } = require("./utils/db");

var { setError } = require("./utils/index");

var { ObjectID } = require("mongodb");

var { waterfall } = require("async");

router.get("/index", (req, res) => {
  res.json({
    code: 200,
    msg: "前后端分离 vue项目的接口地址" + req.query.id
  });
});

router.get("/register", (req, res) => {
  res.json({
    code: 200,
    msg: "注册页面"
  });
});

//注册
router.get("/register", (req, res) => {
  var body = req.body;
  // console.log(body);
  
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
              // console.log(result);
              if (err) {
                cb(err, null);
              } else {
                if (result.username) {
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
                  code: 200,
                  type: 1,
                  msg: "恭喜你,注册成功lalala"
                });
              }
            });
          } else {
            //已被注册 提示用户
            cb(null, {
              code: 200,
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

//登录
router.post("/login", (req, res) => {
  var body = req.body;
  console.log(body);
  conn((err, db) => {
    setError(err, res, db);
    //定义函数
    var findData = (db, cb) => {
      db.collection("userinfo").findOne(
        {
          username: body.username,
          password: body.password
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
          code: 100,
          msg: "用户名或者密码错误,请重新登录!"
        });
      }
      db.close();
    });
  });
});

//add book to mybooklist 把当前用户选择的书存放到他的书架中
router.get("/addToMybooklist", (req, res) => {
  var username = req.query.username;
  var bookid = req.query.id;
  var title = req.query.title;
  var iconUrl = req.query.iconUrl;
  var readCount = req.query.readCount;
  var showTotalCount = req.query.showTotalCount;

  conn((err, db) => {
    // 判断当前这本书在我的书架上是否存在
    // 存在 给提示    不存在 就新增
    if (err) throw err;
    var userbook = db.collection("userbook");
    waterfall(
      [
        cb => {
          //查询是否已经存在
          userbook.findOne(
            {
              username: username,
              bookid: bookid
            },
            (err, result) => {
              if (err) {
                cb(err, null);
              } else {
                if (result) {
                  cb(null, true); //已存在
                } else {
                  cb(null, false); //还没收藏
                }
              }
            }
          );
        },
        (args, cb) => {
          if (!args) {
            //还没收藏 就新增 并且提示成功
            userbook.insertOne(
              {
                username,
                bookid,
                iconUrl,
                title,
                readCount,
                showTotalCount
              },
              (err, result) => {
                if (err) {
                  cb(err, null);
                } else {
                  cb(null, {
                    code: 200,
                    type: 1,
                    msg: "恭喜你,收藏成功"
                  });
                }
              }
            );
          } else {
            //已存在 提示用户
            cb(null, {
              code: 100,
              type: 0,
              msg: "本书已经被你收藏到书架了哦"
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
        console.log(result);
      }
    );
  });
});

//mybooklist 根据当前登录的用户名 获取该用户所收藏的全部书籍
router.get("/mybooks", (req, res) => {
  let username = req.query.username;
  conn((err, db) => {
    setError(err, res, db);
    db.collection("userbook")
      .find(
        {
          username
        },
        {}
      )
      .sort({
        _id: -1
      })
      .toArray((err, result) => {
        setError(err, res, db);
        res.json({
          result,
          code: 200,
          msg: "获取 my list 成功"
        });
        db.close();
      });
  });
});

//delete one book 删除单个
router.get("/deleteOne", (req, res) => {
  var username = req.query.username;
  var id = req.query.bookid;
  conn((err, db) => {
    setError(err, res, db);
    db.collection("userbook").remove(
      {
        username: username,
        bookid: id
      },
      (err, result) => {
        setError(err, res, db);
        res.json({
          result,
          code: 200,
          msg: "删除 单个 成功"
        });
        db.close();
      }
    );
  });
});

//delete all book 删除全部
router.get("/deleteAll", (req, res) => {
  var username = req.query.username;
  conn((err, db) => {
    setError(err, res, db);
    db.collection("userbook").remove(
      {
        username: username
      },
      (err, result) => {
        setError(err, res, db);
        res.json({
          result,
          code: 200,
          msg: "删除 all 成功"
        });
        db.close();
      }
    );
  });
});

//book detail 根据_id获取数据
router.get("/getdetail", (req, res) => {
  var _id = req.query.id;
  conn((err, db) => {
    setError(err, res, db);
    db.collection("booksinfo").findOne(
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

//显示此本书的所有评论
router.get("/getComments", (req, res) => {
  let limit = req.query.limit * 1 || 0;
  var bookid = req.query.id;
  conn((err, db) => {
    setError(err, res, db);
    db.collection("comments")
      .find({ bookid }, {})
      .sort({
        _id: -1
      })
      .limit(limit)
      .toArray((err, result) => {
        setError(err, res, db);
        res.json({
          result,
          code: 200,
          msg: "读者对这本书的所有评论"
        });
        db.close();
      });
  });
});

//添加对这本书的评论
router.get("/addcomment", (req, res) => {
  var username = req.query.username;
  var bookid = req.query.bookid;
  var content = req.query.content;
  var time = req.query.time;
  var likecount = req.query.count;
  conn((err, db) => {
    setError(err, res, db);
    db.collection("comments").insert(
      {
        bookid,
        username,
        content,
        time,
        likecount
      },
      (err, result) => {
        setError(err, res, db);
        res.json({
          result,
          code: 200,
          msg: "add comment 成功"
        });
        db.close();
      }
    );
  });
});

//获取所有信息
router.get("/allBooks", (req, res) => {
  let limit = req.query.limit * 1 || 0;
  conn((err, db) => {
    setError(err, res, db);
    db.collection("booksinfo")
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
          msg: "获取书本信息成功"
        });
        db.close();
      });
  });
});

//获取 都市类 书籍
router.get("/typecity", (req, res) => {
  let limit = req.query.limit * 1 || 0;
  conn((err, db) => {
    setError(err, res, db);
    db.collection("booksinfo")
      .find(
        {
          category: "都市"
        },
        {}
      )
      .sort({
        readCount: -1
      })
      .limit(limit)
      .toArray((err, result) => {
        setError(err, res, db);
        res.json({
          result,
          code: 200,
          msg: "获取信息成功"
        });
        db.close();
      });
  });
});

//获取 现代言情类 书籍
router.get("/typelove", (req, res) => {
  let limit = req.query.limit * 1 || 0;
  conn((err, db) => {
    setError(err, res, db);
    db.collection("booksinfo")
      .find(
        {
          category: "现言"
        },
        {}
      )
      .sort({
        readCount: -1
      })
      .limit(limit)
      .toArray((err, result) => {
        setError(err, res, db);
        res.json({
          result,
          code: 200,
          msg: "获取信息成功"
        });
        db.close();
      });
  });
});

//获取 仙侠类 书籍
router.get("/typeXianXia", (req, res) => {
  let limit = req.query.limit * 1 || 0;
  conn((err, db) => {
    setError(err, res, db);
    db.collection("booksinfo")
      .find(
        {
          category: "仙侠"
        },
        {}
      )
      .sort({
        readCount: -1
      })
      .limit(limit)
      .toArray((err, result) => {
        setError(err, res, db);
        res.json({
          result,
          code: 200,
          msg: "获取信息成功"
        });
        db.close();
      });
  });
});

//获取 穿越类 书籍
router.get("/typeChuanYue", (req, res) => {
  let limit = req.query.limit * 1 || 0;
  conn((err, db) => {
    setError(err, res, db);
    db.collection("booksinfo")
      .find(
        {
          category: "穿越"
        },
        {}
      )
      .sort({
        readCount: -1
      })
      .limit(limit)
      .toArray((err, result) => {
        setError(err, res, db);
        res.json({
          result,
          code: 200,
          msg: "获取信息成功"
        });
        db.close();
      });
  });
});

//获取 古代言情类 书籍
router.get("/typeGuYan", (req, res) => {
  let limit = req.query.limit * 1 || 0;
  conn((err, db) => {
    setError(err, res, db);
    db.collection("booksinfo")
      .find(
        {
          category: "古言"
        },
        {}
      )
      .sort({
        readCount: -1
      })
      .limit(limit)
      .toArray((err, result) => {
        setError(err, res, db);
        res.json({
          result,
          code: 200,
          msg: "获取信息成功"
        });
        db.close();
      });
  });
});

//获取 灵异类 书籍
router.get("/typeLingYi", (req, res) => {
  let limit = req.query.limit * 1 || 0;
  conn((err, db) => {
    setError(err, res, db);
    db.collection("booksinfo")
      .find(
        {
          category: "灵异"
        },
        {}
      )
      .sort({
        readCount: -1
      })
      .limit(limit)
      .toArray((err, result) => {
        setError(err, res, db);
        res.json({
          result,
          code: 200,
          msg: "获取信息成功"
        });
        db.close();
      });
  });
});

//获取 悬疑类 书籍
router.get("/typeXuanYi", (req, res) => {
  let limit = req.query.limit * 1 || 0;
  conn((err, db) => {
    setError(err, res, db);
    db.collection("booksinfo")
      .find(
        {
          category: "悬疑"
        },
        {}
      )
      .sort({
        _id: -1
      })
      .limit(limit)
      .toArray((err, result) => {
        setError(err, res, db);
        res.json({
          result,
          code: 200,
          msg: "获取信息成功"
        });
        db.close();
      });
  });
});

//获取 宫斗类 书籍
router.get("/typeGongDou", (req, res) => {
  let limit = req.query.limit * 1 || 0;
  conn((err, db) => {
    setError(err, res, db);
    db.collection("booksinfo")
      .find(
        {
          category: "宫斗"
        },
        {}
      )
      .sort({
        _id: -1
      })
      .limit(limit)
      .toArray((err, result) => {
        setError(err, res, db);
        res.json({
          result,
          code: 200,
          msg: "获取信息成功"
        });
        db.close();
      });
  });
});

//获取 校园类 书籍
router.get("/typeXiaoYuan", (req, res) => {
  let limit = req.query.limit * 1 || 0;
  conn((err, db) => {
    setError(err, res, db);
    db.collection("booksinfo")
      .find(
        {
          category: "校园"
        },
        {}
      )
      .sort({
        _id: -1
      })
      .limit(limit)
      .toArray((err, result) => {
        setError(err, res, db);
        res.json({
          result,
          code: 200,
          msg: "获取信息成功"
        });
        db.close();
      });
  });
});

//获取 两性关系类 书籍
router.get("/typeSex", (req, res) => {
  let limit = req.query.limit * 1 || 0;
  conn((err, db) => {
    setError(err, res, db);
    db.collection("booksinfo")
      .find(
        {
          category: "两性关系"
        },
        {}
      )
      .sort({
        _id: -1
      })
      .limit(limit)
      .toArray((err, result) => {
        setError(err, res, db);
        res.json({
          result,
          code: 200,
          msg: "获取信息成功"
        });
        db.close();
      });
  });
});

//获取 主编推荐 书籍(外国文学)
router.get("/typeWaiguo", (req, res) => {
  let limit = req.query.limit * 1 || 0;
  conn((err, db) => {
    setError(err, res, db);
    db.collection("booksinfo")
      .find(
        {
          category: "英语读物"
        },
        {}
      )
      .sort({
        _id: -1
      })
      .limit(limit)
      .toArray((err, result) => {
        setError(err, res, db);
        res.json({
          result,
          code: 200,
          msg: "获取信息成功"
        });
        db.close();
      });
  });
});

//获取 成功励志 书籍
router.get("/typeSuccess", (req, res) => {
  let limit = req.query.limit * 1 || 0;
  conn((err, db) => {
    setError(err, res, db);
    db.collection("booksinfo")
      .find(
        {
          category: "成长励志"
        },
        {}
      )
      .sort({
        _id: -1
      })
      .limit(limit)
      .toArray((err, result) => {
        setError(err, res, db);
        res.json({
          result,
          code: 200,
          msg: "获取信息成功"
        });
        db.close();
      });
  });
});

//获取 所有书籍的 种类
router.get("/getTypes", (req, res) => {
  conn((err, db) => {
    setError(err, res, db);
    db.collection("booksinfo").distinct("category", (err, result) => {
      setError(err, res, db);
      res.json({
        result,
        code: 200,
        msg: "获取 书籍分类 成功"
      });
      db.close();
    });
  });
});

module.exports = router;
