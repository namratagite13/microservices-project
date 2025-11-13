const mongoose = require('mongoose');
const argon2 = require('argon2');
const crypto = require('crypto')

const userSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true,
        unique:true,
        trim:true,
    },
    email:{
        type: String,
        required: true,
        unique:true,
        trim: true,
        lowercase:true
    },
    password: {
        type: String,
        required: true,
    },
    resetPasswordToken: String, // Stores the HASHED token
    resetPasswordExpire: Date,// Stores the expiration time
    createdAt:{
        type: Date,
        default: Date.now()
    }
}, {timestamps:true});

userSchema.pre('save', async function (next){
    if(this.isModified('password')){
        try{
            this.password = await argon2.hash(this.password)
        }catch(error){
            return next(error)
        }
    };
    next()

});

//comparing password
userSchema.methods.comparePassword = async function(candidatePassword){
    try{
        return await argon2.verify(this.password, candidatePassword)
    }catch(error){
        throw error
    }
};

userSchema.methods.getResetPasswordToken = function() {
    
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
        
    
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    return resetToken;
};

userSchema.index({username: 'text'});

const User = mongoose.model('User', userSchema);
module.exports = User;
