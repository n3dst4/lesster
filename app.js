
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
    , LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
    function(username, password, returnUser) {
        db.getUserByUsername(username, function(err, user) {
            returnUser(err, (!err) && user && db.checkUserPassword(user, password) && user);
        });
    }
));

passport.serializeUser(function(user, done) {
    console.log("serialize " + user);
    done(null, user.username);
});

passport.deserializeUser(function(username, done) {
    console.log("deserialize " + username);
    db.getUserByUsername(username, done);
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
  
  //app.use(express.session({ secret: 'wn85v7tgnwo8vtgbowv8g' }));
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

// static files
app.get(/\/static\/(.*)/, function(req, res) {
    res.sendfile("static/" + req.params[0]);
});

// perform login
app.post('/login', passport.authenticate('local'), function(req, res) {
    res.send("success")
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


console.log("About to launch listener on port " + process.env.PORT + " " + app.get('port'));
http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});




















