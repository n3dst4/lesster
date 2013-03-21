////////////////////////////////////////////////////////////////////////////////
// DATABASE

var mongo = require('mongodb')
    , _ = require("underscore")
    , passwordHash = require('password-hash');

var MongoClient = mongo.MongoClient,
    Db = mongo.Db,
    BSON = mongo.BSONPure;
    
var users;

// this is the real one!!
//var dbUrl = "mongodb://lesster-dev:lesster-dev@linus.mongohq.com:10080/lesster-dev";

// this is the old one off my fake rest service
var dbUrl = "mongodb://lesster-dev:lesster-dev@alex.mongohq.com:10004/fake-rest-service";

MongoClient.connect(dbUrl, function (err, client){
    if (err) {
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
        done(err, user);
    });
};

exports.checkUserPassword = function (user, password) {
    return user.password === password;
};

exports.getTwitterUser = function (twitterProfile, done) {
    users.findOne({twitterId: twitterProfile.id}, function (err, user) {
        if (err || ! user) {
            var newUser = { twitterId: twitterProfile.id, twitterUsername: twitterProfile.username } ;
            users.insert(newUser, function (err) {
                if (!err) exports.getTwitterUser(twitterProfile, done);
                else done("unable to create user", false);
            });
        }
        else {
            if (user.twitterUsername !== twitterProfile.username) {
                user.twitterUsername = twitterProfile.username;
                users.update(
                    {_id: user._id}, 
                    { "$set": {twitterUsername: twitterProfile.username}},
                    {w: 0}
                );
            }
            done(null, user);
        }
    });
};

/*
 * profile is the oauth profile object (as returned by passport-github and
 * passport-twitter at the very least, not sure about others).
 * 
 * source is the name of the source, e.g. "twitter" or "gitHub". This should be
 * camelcase with lowercase first letter.
 * 
 * done is the callback to feed the retrieved user into.
 */
exports.getUserFromOAuthProfile = function (profile, source, done) {
    var idKey = source + "Id";
    var nameKey = source + "Username";
    var searchCriteria = {};
    searchCriteria[idKey] = profile.id;
    users.findOne(searchCriteria, function (err, user) {
        if (user) {
            if (user[nameKey] !== profile.username) {
                user[nameKey] = profile.username;
                var newVals = {};
                newVals[nameKey] = profile.username;
                users.update(
                    {_id: user._id}, 
                    { "$set": newVals},
                    {w: 0}
                );
            }
            done(null, user);
        }
        else if (!err) {
            var newUser = {};
            newUser[idKey] = profile.id;
            newUser[nameKey] = profile.username;
            users.insert(newUser, function (err) {
                if (!err) exports.getUserFromOAuthProfile(profile, source, done);
                else done("unable to create user", false);
            });
        }
        else { 
            done(err, false);
        }
    });
};

exports.upgradeAccount = function(_id, username, password, password2, email, done) {
    var validationFails = {};

    if (username.length === 0) {
        done({username: "Please enter a username"});
        return;
    }

    if (password.length < 6) {
        done({password: "Password is too short"});
        return;
    }
    else if (password !== password2) {
        done({password: "Passwords do not match"});
        return;
    }
    
    exports.getUserByUsername(username, function(error, existingUser) {
        if (existingUser) {
            done({username: "Username already taken"});
            return;
        }
        var hashed = passwordHash.generate(password);
    
        users.update(
            {_id: _id}, 
            { "$set": {username: username, password: hashed, email: email}},
            function(err) {
                if (err) {
                    done(err); 
                    return;
                }
                done(null);
            }
        );
    });
};

















































