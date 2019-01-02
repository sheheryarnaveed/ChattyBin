var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var passportLocalMongoose = require('passport-local-mongoose');


var friendsSchema = new Schema({
    lastseenid: {
        type: Number,
        required: true
    },
    serial: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
}, {
        timestamps: true
    });

var User = new Schema({
    name: {
        type: String,
        default: ''
    },
    serial: {
        type: Number
    },
    avatar: {
        type: String,
        default: ''
    },
    admin: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        default: 'offline'
    },
    friends: [friendsSchema]
}, {
        timestamps: true
    });

User.plugin(passportLocalMongoose);


module.exports = mongoose.model('User', User);