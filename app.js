
/**
 * Module dependencies.
 */

var express = require('express')
    //, routes = require('./routes')
    , db = require('./lib/db')
    , OAuth = require("./lib/oauth.js").OAuthProvider
    //, task = require('./routes/task')
    , http = require('http')
    , path = require('path')
    , passport = require("passport")
    , LocalStrategy = require('passport-local').Strategy
    , TwitterStrategy = require("passport-twitter").Strategy
    , GitHubStrategy = require("passport-github").Strategy
    , hbs = require('hbs')
    , config = require("./config")
    , _ = require("underscore");

var userAgent = "Lesster/0.0";

////////////////////////////////////////////////////////////////////////////////
// AUTHENTICATION SETUP

passport.use(new LocalStrategy(
    function(username, password, returnUser) {
        db.getUserByUsername(username, function(err, user) {
            returnUser(err, (!err) && user && db.checkUserPassword(user, password) && user);
        });
    }
));

var twitterProvider = new OAuth("twitter", config.baseUrl, {}, TwitterStrategy, {
    consumerKey: config.twitterConsumerKey,
    consumerSecret: config.twitterConsumerSecret
});

var gitHubProvider = new OAuth("github", config.baseUrl, {}, GitHubStrategy, {
    clientID: config.gitHubClientId,
    clientSecret: config.gitHubClientSecret,
    customHeaders: {"User-Agent" : userAgent}
});



passport.serializeUser(function(user, done) {
    console.log("serialize " + user);
    done(null, user._id);
});

passport.deserializeUser(function(id, done) {
    console.log("deserialize " + id);
    db.getUserById(id, function (err, user) {
        done(err, user);
    });
});



////////////////////////////////////////////////////////////////////////////////
// CONFIGURE APP

var app = express();

app.configure('development', function(){
    app.use(express.responseTime());
    app.use(express.errorHandler());
    app.use('/static', express.directory('static'));
});


app.configure(function(){
    app.set('port', config.listenPort || process.env.PORT || 3000);
    app.set('host', config.listenHost || process.env.IP || "0.0.0.0");
    app.set('views', __dirname + '/views');
    app.set('view engine', 'hbs');
    
    app.use('/static', express.static('static'), {maxAge: config.staticMaxAge});
    
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    
    app.use(express.cookieParser(config.cookieSecret));
    app.use(express.cookieSession({secret: config.sessionSecret}));
    app.use(passport.initialize());
    app.use(passport.session());
    
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
    
});



////////////////////////////////////////////////////////////////////////////////
// TEMPLATING SETUP


var hbsFirstHelper = function () {
    var misc = Array.prototype.pop.apply(arguments);
    for (var i = 0; i < arguments.length; i++ ) {
        if (arguments[i]) return arguments[i];
    }
    return "";
};

var hbsAnyHelper = function () {
    return !!(hbsFirstHelper.apply(this, arguments));
};

var hbsCountHelper = function () {
    var count = 0;
    var misc = Array.prototype.pop.apply(arguments);
    console.log(JSON.stringify(arguments));
    for (var i = 0; i < arguments.length; i++ ) {
        if (arguments[i]) count++;
    }
    return count;
};

hbs.registerHelper("first", hbsFirstHelper);
hbs.registerHelper("any", hbsAnyHelper);
hbs.registerHelper("count", hbsCountHelper);


////////////////////////////////////////////////////////////////////////////////
// ROUTES

// main page (static view)
app.get('/', function(req, res) {
    res.sendfile("static/pages/index.html");
});

// routes for oauth sucess and failure
app.get('/oauth/login/success', function(req, res) {
    res.sendfile("static/oauth-login-success.html");
});

app.get('/oauth/link/success', function(req, res) {
    res.sendfile("static/oauth-login-success.html");
});

app.get('/oauth/login/failure', function(req, res) {
    res.sendfile("static/oauth-login-failure.html");
});

app.get('/oauth/link/failure', function(req, res) {
    res.sendfile("static/oauth-link-failure.html");
});

// email verification
app.get('/email-verification-succeeded', function(req, res) {
    res.sendfile("static/pages/email-verification-succeeded.html");
});

app.get('/email-verification-failed', function(req, res) {
    res.sendfile("static/pages/email-verification-failed.html");
});


////////////////////////////////////////////////////////////////////////////////
// REGULAR LOGIN STUFF


// perform login
app.post('/login', passport.authenticate('local'), function(req, res) {
    res.send(req.user);
});

// log out
app.post('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

// get user credentials
app.get('/userdetails', function (req, res) {
    if ( ! req.user) res.send(401);
    else res.send(req.user);
});


////////////////////////////////////////////////////////////////////////////////
// OAUTH STUFFS

twitterProvider.addRoutes(app);
gitHubProvider.addRoutes(app);



////////////////////////////////////////////////////////////////////////////////
// ACCOUNT PAGE STUFF

// get account info
app.get("/account", function (req, res) {
    if (req.user) {
        var user = _.clone(req.user);
        //var pending = db.getPendingEmailChangeRequestsExist(req.user._id);
        //console.log(JSON.stringify(user));
        //user.password = user.password2 = null;
        res.render("account", {
            user: user
        });
    }
    else{
        res.redirect("/");
    }
});

app.post("/account", function (req, res) {
    if (!req.user) res.send(401);
    
    if (req.body.username) {
        db.updateUsername(req.user._id, req.body.username, function (err) {
            if (err) err = {username: "That username isn't available"};
            done(err, {username: req.body.username});
        });
    } 
    else if (req.body.password) {
        var formValues = {password: req.body.password, password2: req.body.password2};
        var msg = (req.body.password !== req.body.password2)? "Passwords do not match" :
            (req.body.password.length < 6)? "Password is not long enough (min 6 characters please)" :
            "";
        if (msg) {
            done({password: msg}, formValues);
        }
        else {
            db.updatePassword(req.user._id, req.body.password, function (err) {
                done(err, formValues);
            });        
        }
    }
    else if (req.body.email) {
        if (req.body.email.indexOf("@") < 0) {
            done({email: "Not a valid email address"}, {email: req.body.email});
        }
        else {
            db.createEmailChangeRequest(req.user._id, req.body.email, function (err) {
                done(err, {email: req.body.email});
            });   
        }
    }
    else {
        done();
    }
    
    function done (err, formValues) {
        if (err) {
            res.render("account", {
                user: req.user, 
                formValues: formValues,
                error: err
            });
        }
        else {
            res.redirect("/account");
        }        
    }
});

app.get("/email-verification/:key", function(req, res) {
    db.verifyEmailChangeRequest(req.params.key, function (err, email) {
        if (err) {console.log(err);}
        res.redirect("/email-verification-" + (err?"failed":"succeeded"));
    });
});





////////////////////////////////////////////////////////////////////////////////
// LAUNCH MOON MSSION

console.log("About to launch listener on " + app.get("host") + ":" + app.get('port'));
console.log("Config: " + config.listenHost + ":" + config.listenPort);
console.log("Env: " + process.env.IP + ":" + process.env.PORT);



http.createServer(app).listen(app.get('port'), app.get('host'), function(){
  console.log("Express server listening on " + app.get("host") + ":" + app.get('port'));
});




















