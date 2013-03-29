////////////////////////////////////////////////////////////////////////////////
// DATABASE

var mongo = require('mongodb')
    , _ = require("underscore")
    , passwordHash = require('password-hash')
    , nodemailer = require("nodemailer")
    , config = require("../config")
    , uuid = require('node-uuid');

var MongoClient = mongo.MongoClient,
    Db = mongo.Db,
    BSON = mongo.BSONPure;
    
var users;
var emailChangeRequests;

var smtpTransport = nodemailer.createTransport("SMTP", {
   service: "Gmail",
   auth: {
       user: config.smtpUsername,
       pass: config.smtpPassword
   }
});



MongoClient.connect(config.dbUrl, function (err, client){
    if (err) {
        throw err;
    }
    exports.client = client;
    users = client.collection('users');
    emailChangeRequests = client.collection('emailChangeRequests');
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
    return password.length > 1 && 
        ((passwordHash.isHashed(user.password) && passwordHash.verify(password, user.password))
        || (user.password === password));
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


exports.addOAuthProfileToUser = function (userId, profile, source, done) {
    var idKey = source + "Id";
    var nameKey = source + "Username";
    var searchCriteria = {};
    searchCriteria[idKey] = profile.id;
    var updateVals = {};
    updateVals[idKey] = profile.id;
    updateVals[nameKey] = profile.username;
    users.findOne(searchCriteria, function (err, user) {
        //if (user) err = {type: "validation", message: ""};
        if (err || user) return done(err, false);
        users.findAndModify(
            {_id: userId},
            {_id: 1},
            {"$set": updateVals},
            {},
            function (err, user) {
                done(err, user);
            }
        );
    });
}

exports.unlinkOAuth = function (userId, source, done) {
    var update = {};
    update[source + "Id"] = 1;
    update[source + "Username"] = 1;
    users.update(
        {_id: userId},
        {"$unset": update},
        {safe: true},
        done
    );    
};


//exports.upgradeAccount = function(_id, username, password, password2, email, done) {
//    var validationFails = {};
//
//    if (username.length === 0) {
//        done({username: "Please enter a username"});
//        return;
//    }
//
//    if (password.length < 6) {
//        done({password: "Password is too short"});
//        return;
//    }
//    else if (password !== password2) {
//        done({password: "Passwords do not match"});
//        return;
//    }
//    
//    exports.getUserByUsername(username, function(error, existingUser) {
//        if (existingUser) {
//            done({username: "Username already taken"});
//            return;
//        }
//        var hashed = passwordHash.generate(password);
//        
//        if (email) exports.createEmailChangeRequest(_id, email, function (err) {
//            if (err) { done(err); return; }
//            users.update(
//                {_id: _id}, 
//                { "$set": {username: username, password: hashed}},
//                function(err) {
//                    if (err) {
//                        done(err); 
//                        return;
//                    }
//                    done(null);
//                }
//            );
//        });
//    });
//};


exports.createEmailChangeRequest = function(_id, email, done) {
    var key = uuid.v4(),
        url = config.emailChangeRequestUrl + key,
        changeRequest = {
            userId: _id,
            newEmail: email,
            key: key,
            created: new Date()
        },
        message= {
            from: "Lesster <lesster@lumphammer.com>", // sender address
            to: email, // comma separated list of receivers
            subject: "Please confirm your email address", // Subject line
            text: "Someone has requested that your email address, " + email + " " +
                "be use for their account on Lesster. If this was not you, " +
                "please ignore this message. Otherwise, if you recognize " +
                "this request, please visit " + url + " to validate your address."
        };
        
    emailChangeRequests.insert(changeRequest, function(err, objects) {
        if (err) { done(err); return; }
        changeRequest = objects[0];
        changeRequest.messageSent = new Date();
        smtpTransport.sendMail(message, function(error, response){
            if (error) { console.log(error); done(err); return; }
            console.log("Message sent: " + response.message);
            emailChangeRequests.save(changeRequest,  {safe:false});
            done(null);
        });
        
    });
};

exports.verifyEmailChangeRequest = function (key, done) {
    
    emailChangeRequests.findOne({key: key}, function(err, changeRequest){
        if (err) { done(err); return; }
        if (!changeRequest) { 
            done({message: "This request could not be found."}); 
            return;
        }
        if (changeRequest.verified){ 
            done({message: "This request has already been processed."}); 
            return; 
        }
        users.update(
            {_id: changeRequest.userId},
            {"$set": {email: changeRequest.newEmail}},
            {safe: true},
            function (err) {
                changeRequest.verified = new Date();
                emailChangeRequests.save(changeRequest, {safe:false});
                done(err, err?null:changeRequest.newEmail);
            }
        );
    });
    
};


exports.updatePassword = function (userId, password, done) {
    var hashed = passwordHash.generate(password);
    users.update(
        {_id: userId}, 
        { "$set": {password: hashed}},
        {safe: true},
        done
    );
};



exports.updateUsername = function (userId, username, done) {
    users.update(
        {_id: userId}, 
        { "$set": {username: username}},
        {safe: true},
        done
    );
};














































