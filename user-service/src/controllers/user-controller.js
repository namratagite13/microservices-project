
const User = require('../models/User');
const logger = require('../utils/logger');
const {validationRegistration, validateLogin} = require('../utils/validateToken');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcrypt');
const sendEmail = require('../utils/sendMail')
const crypto = require('crypto');

//user registration
const registerUser = async(req, res) =>{
    logger.info('Registration endpoint hit.');

    try{
        const {error} = validationRegistration(req.body);
        if(error){
            logger.warn('Validation error.', error.details[0].message)
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const {email, password, username} = req.body;

        let newUser = await User.findOne({$or: [{username}, {email}]});
        if(newUser){
            logger.warn('User already exists!!');
            return res.status(400).json({
                success: false,
                message: 'User already exists.'
            })
        };

        newUser = new User({username, email, password});
        await newUser.save();
        logger.warn('User saved successfully!!')


        const {accessToken, refreshToken} = await generateToken(newUser);
        res.status(201).json({
            success: true,
            message: 'User registered successfully!!',
            accessToken,
            refreshToken
        });


    }catch(e){
        logger.error('Registration error occurred!', e);
        res.status(500).json({
            success: false,
            message: "Internal server error.", 
        });

    }
};

const loginUser = async (req, res) =>{
    try{ 
    logger.info('login endpoint hit...')
    const {error} = validateLogin(req.body);
    if(error){
        logger.warn('Validation error.', error.details[0].message)
        return res.status(400).json({
            success: false,
            message: error.details[0].message,
        });
    };

    const {email, password} = req.body;
    const user = await User.findOne({email});

    if(!user){
        logger.warn('Credentials not match.');
        return res.status(400).json({
            success: false,
            message: 'Invalid Credentials.',
        });
    };

    //password valid or not
    const isValidPassword = await user.comparePassword(password)
    if(!isValidPassword){
        logger.warn('Login attempt failed: invalid password.');
        return res.status(400).json({
            success: false,
            message: 'Invalid Credentials.',
        });
        
    };

    const {accessToken, refreshToken} = await generateToken(user);

    //setting refresh token http-only
    const oneDay = 1000 * 60 * 60 * 24; // 1day expiry

    res.cookie('jwt', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite : 'strict',
        expires: new Date(Date.now() + oneDay)

    });

    res.status(200).json({
        success: true,
        message: 'User logged in successfully!!',
        accessToken,
        refreshToken,
        
    });

    }catch(e){
        logger.error('Login error occurred!', e);
        res.status(500).json({
            success: false,
            message: "Internal server error.", 
        });

    }

};

const getUserProfile = async (req, res) =>{

    try{ 
       const userId = req.user.userId; 
       const user = await User.findById(userId);
       
       if(!user){
            return res.status(400).json({
                success: false,
                message: "User not found!"
            })
        };
        
        res.status(200).json({
            success:true,
            message: 'User Profile fetched successfully.',
            user:{
                userId : user.id,
                userName: user.username,
                userEmail: user.email,
                createdAt: user.createdAt,

            }
            
        })
    }catch(e){
        logger.error('Login error occurred!', e);
        res.status(500).json({
            success: false,
            message: "Internal server error.", 
        });
        
    }
    
};

const forgotPassword = async (req, res) =>{
    const { email } = req.body;

    if(!email){
        logger.warn('Forgot password attempted without an email address.');
        return res.status(400).json({
            success: false,
            message: 'Please provide an email address.'
        })
    }
    try{

        const user = await User.findOne({email});
        if(!user){
            logger.warn(`Forgot Password attempted for non-existent email: ${email}`)
            return res.status(200).json({
                success: true,
                message: 'If the email address is registered, a password reset link will be send to it.'
            });
        }

        const resetToken = user.getResetPasswordToken() // unhashed token
        await user.save({validateBeforeSave: false});

        //reset url
        const resetUrl = `${req.protocol}://${req.get('host')}/api/users/resetpassword/${resetToken}`

        const message = `you are receiving this email because you requested a password reset. Please click on the link below to reset your password.\n\n${resetUrl}`
        try{
            await sendEmail({
                to: user.email,
                subject: 'Password Reset Request',
                text: message
            })
            logger.info(`Password reset email successfully sent to ${user.email}`);

            res.status(200).json({
                success: true,
                message: 'Password reset link sent to your email.'
            })
        }catch(error){
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({validateBeforeSave: false});

            logger.error(`Email failed for user ${user.email}: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: 'Server error: Email could not be sent. Try again later.'
            })
        }
    }catch(e){
        logger.error('Internal error in forgotPassword controller:', e);
        res.status(500).json({
            success: false,
            message: "Internal server error during password recovery.", 
        });

    }
};

//reset password

const resetPassword = async(req, res) =>{

    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resettoken) // token from the URL path
        .digest('hex');

    const {newPassword, confirmPassword} = req.body;

    if(!newPassword || !confirmPassword){
        return res.status(400).json({
            success: false,
            message: 'please provide both new and confirmation password.'
        });
    }
    if(newPassword !== confirmPassword){
        return res.status(400).json({
            success: false,
            message: 'Password do not match.'
        });
    }
    try{
            
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire : {$gt: Date.now()}
        });

        if(!user){
            logger.warn(`Invalid or expired token used: ${req.params.resetToken}`);
             return res.status(400).json({
                success: false,
                message: 'Invalid or expired password reset token.'
            });
        }
        
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        logger.info(`Password successfully reset for user ${user.email}`)
        res.status(200).json({
            success: true,
            message: 'Password successfully reset.'
        })

    }catch(e){
        logger.error('Internal server error.', e);
        res.status(500).json({
            success: false,
            message: 'Internal server error during password reset.'
        });
    }



};

    


module.exports = {registerUser, loginUser, getUserProfile, forgotPassword, resetPassword}