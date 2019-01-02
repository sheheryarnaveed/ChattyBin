var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('./models/user');

var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config.js');

exports.local = passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

exports.getToken = function (user) {
    return jwt.sign(user, config.secretKey);
};

var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretKey;

exports.jwtPassport = passport.use(new JwtStrategy(opts,
    (jwt_payload, done) => {
        User.findOne({ _id: jwt_payload._id }, (err, user) => {
            if (err) {
                return done(err, false);
            }
            else if (user) {
                return done(null, user);

            }
            else {
                return done(null, false);
            }
            
        });
    }));

exports.verifyUser = passport.authenticate('jwt', { session: false });

exports.auth = function auth(req, res, next) {
    if (!req.session.passport) {
        var err = new Error('You are not authenticated!');
        err.status = 403;
        next(err);
    }
    else {
        next();
    }
};

exports.verifyAdmin = function (req, res, next) {
    if (req.user.admin) {
        next();
    }
    else {
        var err = new Error('You are not authorized to perform this operation!!');
        err.status = 403;
        return next(err);
    }
};
