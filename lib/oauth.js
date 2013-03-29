var db = require('./db')
    , passport = require("passport")
    , _ = require("underscore");

var loginSuffix = "-login";
var linkSuffix = "-link";

exports.OAuthProvider = function (name, baseUrl, basePath, Strategy, config) {
    
    this.name = name;
    this.unlinkPath = basePath + "/" + name + "/unlink";
    
    config.passReqToCallback = true;
    
    var authFuncs = {
        login: function(req, token, tokenSecret, profile, done) {
            db.getUserFromOAuthProfile(profile, name, done);
        },
        link: function(req, token, tokenSecret, profile, done) {
            if (!req.user) {done(new Error("Not logged in")); return;}
            db.addOAuthProfileToUser(req.user._id, profile, name, done);
        }
    };

    var roles = this.roles = {};

    _.each(["login", "link"], function (roleName) {
        var role = roles[roleName] = {};
        role.startPath = basePath + "/" + name + "/" + roleName;
        role.callbackPath = role.startPath + "/callback";
        role.callbackUrl = baseUrl + role.callbackPath;
        role.strategyName = name + "-" + roleName;
        var roleConfig = _({callbackURL: role.callbackUrl}).extend(config);
        var strategy = new Strategy(roleConfig, authFuncs[roleName]);
        passport.use(role.strategyName, strategy);
    });
    
}

exports.OAuthProvider.prototype.addRoutes = function (app) {
    var self = this;
    _.each(this.roles, function (role) {
        //console.log(JSON.stringify(role));
        app.get(role.startPath, passport.authenticate(role.strategyName));
        app.get(role.callbackPath, 
            passport.authenticate(role.strategyName, 
                { successRedirect: '/oauth/login-succeeded',
                failureRedirect: '/oauth/login-failed' })
        );
    });
    
    app.post(this.unlinkPath, function (req, res){
        db.unlinkOAuth(req.user._id, self.name, function(err) {
            res.redirect("/account");
        });
    });
}


















