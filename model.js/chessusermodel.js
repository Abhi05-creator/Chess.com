const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(value) {
                return validator.isEmail(value);
            },
            message: 'Invalid email address'
        }
    },
    password: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['ingame', 'outgame', 'offline'],
        default: 'offline'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    rank: {
        type: Number,
        default: 1200
    },
    gamesPlayed:{
        type:Number,
        default:0
    },
    wins:{
        type:Number,
        default:0
    },
    losses:{
        type:Number,
        default:0
    },

    
});

const User = mongoose.model('User', userSchema);
module.exports = User;