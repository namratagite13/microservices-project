
const express = require('express');
const {registerUser, loginUser, getUserProfile, forgotPassword, resetPassword} = require('../controllers/user-controller');
const {identityCheckMiddleware} = require("../middleware/identityCheckMiddleware")
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/getProfile', identityCheckMiddleware,  getUserProfile)
router.post('/forgotPassword',  forgotPassword)
router.post('/resetPassword/:resettoken',  resetPassword); 



module.exports = router;