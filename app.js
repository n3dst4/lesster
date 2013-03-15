
/**
 * Module dependencies.
 */

var express = require('express')
    , connect = require("connect")
    //, routes = require('./routes')
    , db = require('./db')
    //, task = require('./routes/task')
    , http = require('http')
    , path = require('path')
    , passport = require("passport")
    , LocalStrategy = require('passport-local').Strategy
    , TwitterStrategy = require("passport-twitter").Strategy
    , GitHubStrategy = require("passport-github").Strategy
    , config = require("./config");

passport.use(new LocalStrategy(
    function(username, password, returnUser) {
        db.getUserByUsername(username, function(err, user) {
            returnUser(err, (!err) && user && db.checkUserPassword(user, password) && user);
        });
    }
));

passport.use(new TwitterStrategy({
        consumerKey: config.twitterConsumerKey,
        consumerSecret: config.twitterConsumerSecret,
        callbackURL: config.twitterCallbackUrl
    },
    function(token, tokenSecret, profile, done) {
        db.getUserFromOAuthProfile(profile, "twitter", done);
    }
));

passport.use(new GitHubStrategy({
    clientID: config.gitHubClientId,
    clientSecret: config.gitHubClientSecret,
    callbackURL: config.gitHubCallbackUrl
  },
  function(accessToken, refreshToken, profile, done) {
    db.getUserFromOAuthProfile(profile, "gitHub", done);
  }
));


passport.serializeUser(function(user, done) {
    console.log("serialize " + user);
    done(null, user._id);
});

passport.deserializeUser(function(id, done) {
    console.log("deserialize " + id);
    db.getUserById(id, function (err, user) {
        console.log("getUserById for user id " + id + " returned " + user + " with error " + err);
        done(err, user);
    });
});


var app = express();

app.configure(function(){
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    
    app.use(express.cookieParser('some secret'));
    app.use(express.cookieSession({secret: 'wn85v7tgnwo8vtgbowv8g'}));
    app.use(passport.initialize());
    app.use(passport.session());
    
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});


console.log("About to set up routes");

// main page (static view)
app.get('/', function(req, res) {
    res.sendfile("static/index.html");
});

app.get('/oauth-login-succeeded', function(req, res) {
    res.sendfile("static/oauth-login-succeeded.html");
});

app.get('/oauth-login-failed', function(req, res) {
    res.sendfile("static/oauth-login-failed.html");
});

// static files
app.get(/\/static\/(.*)/, function(req, res) {
    res.sendfile("static/" + req.params[0]);
});

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

// Redirect the user to Twitter for authentication.  When complete, Twitter
// will redirect the user back to the application
app.get('/twitter-login', passport.authenticate('twitter'));

// Redirect the user to GitHub for authentication.  When complete, GitHub
// will redirect the user back to the application
app.get('/github-login', passport.authenticate('github'));

// Twitter will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
app.get('/twitter-login-callback', 
    passport.authenticate('twitter', { successRedirect: '/oauth-login-succeeded',
                                       failureRedirect: '/oauth-login-failed' })
);

// GitHub will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
app.get('/github-login-callback', 
    passport.authenticate('github', { successRedirect: '/oauth-login-succeeded',
                                       failureRedirect: '/oauth-login-failed' })
);


console.log("About to launch listener on port " + process.env.PORT + " " + app.get('port'));
http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});




















