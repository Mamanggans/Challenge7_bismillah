const route = require("express").Router();
const {createUser, processAccountVerification, initiatePasswordReset,initiatePasswordReset,loginUser} = require("../controller/mainController");
const { validatePostUser } = require("../middleware/middleware");
const multer = require("multer")();

// Endpoint untuk membuat pengguna baru
route.post('/register', createUser);

// Endpoint untuk otentikasi pengguna
route.post('/login', loginUser);

// Endpoint untuk verifikasi akun
route.get('/verify', processAccountVerification);

// Endpoint untuk memulai proses reset password
route.post('/forgotPassword', initiatePasswordReset);

// Endpoint untuk mereset password
route.post('/resetPassword', initiatePasswordReset);

module.exports = route;