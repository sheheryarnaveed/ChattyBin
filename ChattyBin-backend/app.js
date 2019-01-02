var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var passport = require('passport');
var authenticate = require('./authenticate');
const port = process.env.PORT || 5555;
const cors = require('cors');


var usersRouter = require('./routes/users');

var config = require('./config');
const mongoose = require('mongoose');
mongoose.Promis = require("bluebird");
const url = config.mongoUrl;
const connect = mongoose.connect(url);

connect.then((db) => {
    console.log("Connected correctly to server");
}, (err) => { console.log(err); });

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');//jade has been depreciated and is
                               //upgraded to pug

app.use(cors({ origin: 'http://localhost:8080', credentials: true }));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session({
    name: 'session-id',
    secret: 'Shhhhhhh!defenseagainst',
    saveUninitialized: false,
    resave: false,
    store: new FileStore()
}));


app.use(passport.initialize());
app.use(passport.session());

app.use('/users', usersRouter);

/*
function auth(req, res, next) {
    console.log(req.user);

    if (!req.session) {
        var err = new Error('You are not authenticated!');
        err.status = 403;
        next(err);
    }
}
app.use(auth);*/

app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, () => {
    console.log("Listening on port " + port);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Application Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

