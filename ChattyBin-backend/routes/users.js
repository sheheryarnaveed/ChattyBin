var express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var User = require('../models/user');
var Messages = require('../models/message');
var passport = require('passport');

var authenticate = require('../authenticate');
const cors = require('./cors');

var router = express.Router();
router.use(bodyParser.json());

router.post('/login', cors.corsWithOptions, passport.authenticate('local'), (req, res) => {
    var token = authenticate.getToken({ _id: req.user._id });
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', "http://localhost:8080");
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.send(JSON.stringify({ success: true, token: token, status: 'Successful Login' }));
});

router.get('/logout', cors.corsWithOptions, (req, res, next) => {
    if (req.session && req.user) {
        User.findByIdAndUpdate(req.user.id, {
            $set: { "status": "offline" }
        })
            .then((info) => {
                res.setHeader('Access-Control-Allow-Origin', "http://localhost:8080");
                res.setHeader('Access-Control-Allow-Credentials', 'true');
                req.logout();
                req.session.destroy();
                res.clearCookie('session-id');
                res.send("Logout Success!");
            }, (err) => next(err))
            .catch((err) => next(err));
    }
    else {
        var err = new Error('You are not logged in!');
        err.status = 403;
        next(err);
    }
});

router.get('/getconversation/:friendID', cors.corsWithOptions, authenticate.auth, authenticate.verifyUser, (req, res, next) => {
    Messages.count({}, function (err, total) {
        if (total > 0) {
            Messages.find({})
                .then((messages) => {
                    res.statusCode = 200;
                    res.setHeader('Access-Control-Allow-Origin', "http://localhost:8080");
                    res.setHeader('Access-Control-Allow-Credentials', 'true');
                    var data = {};
                    data.messages = [];
                    var count_seen = 0;
                    var count = 0;
                    messages.forEach(function (message) {
                        console.log(message);
                        if (message.receiverSerial == req.params.friendID && message.senderSerial == req.user.serial || message.receiverSerial == req.user.serial && message.senderSerial == req.params.friendID) {
                            data.messages.push({ "serial": message.serial, "message": message.message, "receiverSerial": message.receiverSerial, "senderSerial": message.senderSerial, "date": message.createdAt.toDateString(), "time": message.createdAt.toTimeString().split(' ')[0] });
                            if (message.senderSerial == req.params.friendID) {
                                count_seen++;
                                if (message.status != "seen") {
                                    message.status = "seen";
                                    message.save();
                                }
                                console.log(count_seen);
                            }
                        }
                        count++;

                        if (count == messages.length) {
                            User.findOne({ "serial": req.params.friendID })
                                .then((info) => {
                                    data.name = info.name;
                                    data.avatar = info.avatar;
                                    data.serial = info.serial;
                                    data.status = info.status;
                                    info.friends.forEach(function (found_friend) {
                                        if (found_friend.serial == req.user.serial) {
                                            found_friend.lastseenid = count_seen;
                                            found_friend.save();
                                        }
                                    });
                                    console.log("Just before!");
                                    res.setHeader('Content-Type', 'application/json');
                                    res.json(data);

                                }, (err) => next(err))
                                .catch((err) => next(err));


                        }
                    });
                }, (err) => next(err))
                .catch((err) => next(err));
        }
        else {
            User.findOne({ "serial": req.params.friendID })
                .then((info) => {
                    var data = {};
                    data.name = info.name;
                    data.avatar = info.avatar;
                    data.serial = info.serial;
                    data.status = info.status;
                    res.setHeader('Access-Control-Allow-Origin', "http://localhost:8080");
                    res.setHeader('Access-Control-Allow-Credentials', 'true');
                    res.setHeader('Content-Type', 'application/json');
                    res.json(data);

                }, (err) => next(err))
                .catch((err) => next(err));
        }
    });
});



router.post('/postmessage/:friendID', bodyParser.json(), cors.corsWithOptions, authenticate.auth, authenticate.verifyUser, (req, res, next) => {
    var message = req.body.message;
    Messages.count({}, function (err, total) {
        var serial = total + 1;
        Messages.create({ message: message, receiverSerial: req.params.friendID, senderSerial: req.user.serial, serial: serial.toString() })
            .then((new_message) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', "http://localhost:8080");
                res.setHeader('Access-Control-Allow-Credentials', 'true');
                res.json(new_message);
            }, (err) => next(err))
            .catch((err) => next(err));
    });
});


router.get('/getnewmsgnum/:friendID', cors.corsWithOptions, authenticate.auth, authenticate.verifyUser, (req, res, next) => {
    Messages.count({}, function (err, total) {
        if (total > 0) {
            Messages.find({})
                .then((messages) => {
                    res.statusCode = 200;
                    res.setHeader('Access-Control-Allow-Origin', "http://localhost:8080");
                    res.setHeader('Access-Control-Allow-Credentials', 'true');
                    var count = 0;
                    var unread = 0;
                    var data = {};
                    messages.forEach(function (message) {
                        if (message.receiverSerial == req.user.serial && message.senderSerial == req.params.friendID && message.status != "seen") {
                            unread++;
                        }
                        count++;
                        if (count == messages.length) {
                            if (unread != 0) {
                                data.unread = unread+ '';
                            }
                            else {
                                data.unread = '';
                            }
                           
                            res.setHeader('Content-Type', 'application/json');
                            
                            res.json(data);
                        }
                    });
                }, (err) => next(err))
                .catch((err) => next(err));
        }
        else {
            var data = {};
            data.unread = "0";
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', "http://localhost:8080");
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.json(data);
        }
        });
});


router.get('/getnewmessages/:friendID', cors.corsWithOptions, authenticate.auth, authenticate.verifyUser, (req, res, next) => {
    Messages.find({})
        .then((messages) => {
            res.statusCode = 200;
            res.setHeader('Access-Control-Allow-Origin', "http://localhost:8080");
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            var count = 0;
            var count_seen = 0;
            var data = {};
            data.newmsg = [];
            messages.forEach(function (message) {
                if (message.receiverSerial == req.user.serial && message.senderSerial == req.params.friendID && message.status != "seen") {
                    count_seen++;
                    message.status = "seen";
                    data.newmsg.push({ "serial": message.serial, "message": message.message, "receiverSerial": message.receiverSerial, "senderSerial": message.senderSerial, "date": message.createdAt.toDateString(), "time": message.createdAt.toTimeString().split(' ')[0] });
                    message.save();
                }
                count++;
                if (count == messages.length) {
                    User.findOne({ "serial": req.params.friendID })
                        .then((info) => {
                            data.status = info.status;
                            info.friends.forEach(function (found_friend) {
                                if (found_friend.serial == req.user.serial) {
                                    found_friend.lastseenid = count_seen + found_friend.lastseenid;
                                    found_friend.save();
                                }
                            });
                            res.setHeader('Content-Type', 'application/json');
                            
                            res.json(data);
                        }, (err) => next(err))
                        .catch((err) => next(err));
                }
            });
        }, (err) => next(err))
        .catch((err) => next(err));
});


router.get('/getuserinfo', cors.corsWithOptions, authenticate.auth, authenticate.verifyUser, (req, res, next) => {
    User.findOne({ "serial": req.user.serial})
        .then((info) => {
            res.statusCode = 200;
            res.setHeader('Access-Control-Allow-Origin', "http://localhost:8080");
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            if (info.status) {
                info.status = "online";
            }
            
            var data = {};
            data.name = info.name;
            data.avatar = info.avatar;
            data.serial = info.serial;
            data.status = info.status;
            data.friends = [];
            info.save();
            var i = 0;
            console.log(info.friends);
            info.friends.forEach(function (friend) {
                console.log(friend);
                User.findOne({ "serial": friend.serial }, function (err, sec) {
                    if (err == null) {
                        data.friends.push({ "name": sec.name, "lastseenid": friend.serial, "serial": sec.serial, "status": sec.status });
                    }
                    else {
                        res.send({
                            message: err
                        });
                    }
                    i++;
                    if (info.friends.length == i){
                        res.setHeader('Content-Type', 'application/json');

                        res.json(data);

                    }
                });
            });
            
        }, (err) => next(err))
        .catch((err) => next(err));
});

router.delete('/deletemessage/:messageid', cors.cors, authenticate.auth, authenticate.verifyUser, (req, res, next) => {
    Messages.findOne({ "serial": req.params.messageid })
        .then((message) => {
            if (message != null) {
                if (message.senderSerial == req.user.serial) {
                    message.remove();
                    message.save()
                        .then((dish) => {
                            res.statusCode = 200;
                            res.setHeader('Access-Control-Allow-Origin', "http://localhost:8080");
                            res.setHeader('Access-Control-Allow-Credentials', 'true');
                            res.send('successfully deleted');
                        }, (err) => next(err));
                }
                else {
                    res.setHeader('Access-Control-Allow-Origin', "http://localhost:8080");
                    res.setHeader('Access-Control-Allow-Credentials', 'true');
                    res.send("failed to delete");
                }
            }
            else {
                err = new Error('Message ' + req.params.messageid + ' not found');
                err.status = 404;
                return next(err);
            }

        }, (err) => next(err))
        .catch((err) => next(err));
});


/*
router.post('/signup', cors.corsWithOptions, (req, res, next) => {
    User.register(new User({ username: req.body.username }),
        req.body.password, (err, user) => {
            if (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.json({ err: err });
            }
            else {
                if (req.body.name)
                    user.name = req.body.name;
                if (req.body.serial)
                    user.serial = req.body.serial;
                if (req.body.avatar)
                    user.avatar = req.body.avatar;
                if (req.body.friends)
                    user.friends = req.body.friends;
                user.save((err, user) => {
                    if (err) {
                        res.statusCode = 500;
                        res.setHeader('Content-Type', 'application/json');
                        res.json({ err: err });
                        return;
                    }
                    passport.authenticate('local')(req, res, () => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json({ success: true, status: 'Registration Successful!' });
                    });
                });
            }
        });
});
*/

module.exports = router;
