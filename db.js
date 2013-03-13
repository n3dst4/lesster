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

exports.getUserById = function (id, done) {
    users.findOne({_id: new BSON.ObjectID(id)}, function (err, user) {
        console.log("findOne callback!")
        done(err, user);
    });
};

exports.checkUserPassword = function (user, password) {
    return user.password === password;
};

exports.getTwitterUser = function (twitterProfile, done) {
    users.findOne({twitterId: twitterProfile.id}, function (err, user) {
        if (err || ! user) {
            var newUser = { twitterId: twitterProfile.id } ;
            users.insert(newUser, function (err) {
                if (!err) exports.getTwitterUser(twitterProfile, done);
                else done("unable to create user", false);
            });
        }
        else {
            done(null, user);
        }
    });
};




















































