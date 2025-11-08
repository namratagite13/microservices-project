
const mongoose = require('mongoose');
//new = build new object based on blueprint
const refreshTokenSchema= new mongoose.Schema({

    token:{
        type:String,
        required: true,
        unique:true
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    expiresAt:{
        type:Date,
        required: true
    }
},{timeStamps: true});



refreshTokenSchema.index({expiresAt:1}, {expireAfterSeconds: 0});

const RefreshToken = mongoose.model('RefreshToken',refreshTokenSchema);
module.exports = RefreshToken;