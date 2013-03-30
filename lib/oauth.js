var db = require('./db')
    , passport = require("passport")
    , _ = require("underscore");

var defaultPathConfig = {
    base: "/oauth",
    callback: "/callback",
    unlink: "/unlink",
    success: "/success",
    failure: "/failure"
};


/*
 *
 */
exports.OAuthProvider = function (name, baseUrl, pathConfig, Strategy, config) {
    
    pathConfig = this.pathConfig = _.extend(pathConfig||{}, defaultPathConfig);
    
    this.name = name;
    this.unlinkPath = pathConfig.base + "/" + name + pathConfig.unlink;
    //this.successPath = 
    
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
        role.startPath = pathConfig.base + "/" + name + "/" + roleName;
        role.callbackPath = role.startPath + pathConfig.callback;
        role.callbackUrl = baseUrl + role.callbackPath;
        role.strategyName = name + "-" + roleName;
        role.successPath = pathConfig.base + "/" + roleName + pathConfig.success;
        role.failurePath = pathConfig.base + "/" + roleName + pathConfig.failure;
        var roleConfig = _({callbackURL: role.callbackUrl}).extend(config);
        var strategy = new Strategy(roleConfig, authFuncs[roleName]);
        passport.use(role.strategyName, strategy);
    });
    
}


/*
 *
 */
exports.OAuthProvider.prototype.addRoutes = function (app) {
    var self = this;
    _.each(this.roles, function (role) {
        //console.log(JSON.stringify(role));
        app.get(role.startPath, passport.authenticate(role.strategyName));
        app.get(role.callbackPath, 
            passport.authenticate(role.strategyName, 
                { successRedirect: role.successPath,
                failureRedirect: role.failurePath })
        );
    });
    
    app.post(this.unlinkPath, function (req, res){
        db.unlinkOAuth(req.user._id, self.name, function(err) {
            res.redirect("/account");
        });
    });
};


















