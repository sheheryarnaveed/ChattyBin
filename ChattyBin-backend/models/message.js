var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Messages = new Schema({
    message: {
        type: String,
        default: ''
    },
    serial: {
        type: Number
    },
    receiverSerial: {
        type: Number
    },
    senderSerial: {
        type: Number
    },
    status: {
        type: String,
        default: 'sent'
    }
}, {
        timestamps: true
    });

module.exports = mongoose.model('Messages', Messages);