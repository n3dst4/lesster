////////////////////////////////////////////////////////////////////////////////
// DATABASE

var mongo = require('mongodb')
    , _ = require("underscore");

var MongoClient = mongo.MongoClient,
    Db = mongo.Db,
    BSON = mongo.BSONPure;
    
var users;

//var dbUrl = "mongodb://lesster-dev:lesster-dev@linus.mongohq.com:10080/lesster-dev";
var dbUrl = "mongodb://lesster-dev:lesster-dev@alex.mongohq.com:10004/fake-rest-service";

MongoClient.connect(dbUrl, function (err, client){
    if (err) {
        console.log(err);
        throw err;
    }
    exports.client = client;
    users = client.collection('users');
    console.log("users collection: " + users);
    //users.insert({username: "qq", password: "qq"}, { w: 0 });
});

exports.getUserByUsername = function (username, done) {
    if (!users) done("db not ready yet", null);
    else users.findOne({username: username}, done);
};

exports.checkUserPassword = function (user, password) {
    return user.password === password;
};




















































