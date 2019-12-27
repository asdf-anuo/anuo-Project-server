//连接数据库

let {MongoClient} = require ("mongodb");
// const DB_URL = "mongodb://39.96.63.112:27017";
const DB_URL = "mongodb://localhost:27017";
const DB_NAME = "bookshop";
let dbObj = null;

module.exports ={
    conn(callback){
        MongoClient.connect(DB_URL,(err,client)=>{
            if(err){
                callback(err,null);
                throw err;
            }else{
                console.log("数据库已连接,搞事情!");
                dbObj = client.db(DB_NAME);
                callback(null,dbObj);
            }
        })
    }
}