"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../handlers/auth");
const passport_1 = __importDefault(require("passport"));
const authMiddleware_1 = require("../lib/authMiddleware");
const getMediaLinkHelper_1 = require("../lib/getMediaLinkHelper");
const router = (0, express_1.Router)();
// /api/auth/signup
router.post('/signup', auth_1.postSignup);
// passport is a middleware, the done function is the next function
// if the login credentials that user provides to this api route is valid
router.post('/login', (req, res, next) => {
    passport_1.default.authenticate('local', (err, user, info) => {
        if (err)
            return next(err);
        if (!user) {
            return res.status(401).json({ message: (info === null || info === void 0 ? void 0 : info.message) || 'Login failed' });
        }
        req.logIn(user, (err) => {
            if (err)
                return next(err);
            return res.status(200).json({ message: 'Login successful' });
        });
    })(req, res, next);
});
router.get('/me', authMiddleware_1.isAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    // check if user has profile picture
    const profile_picture_link = yield (0, getMediaLinkHelper_1.getProfilePictureUrl)(user.user_id);
    res.json(Object.assign(Object.assign({}, user), { profile_picture_link }));
}));
router.get('/check-username', auth_1.isUsernameUnique);
router.post('/verify-email', auth_1.verifyEmailHandler);
router.post('/resend-verification-email', auth_1.resendVerificationEmailHandler);
router.post('/forgot-password', auth_1.handleForgotPassword);
router.post('/reset-password', auth_1.handleResetPassword);
router.get('/logout', (req, res, next) => {
    req.logout(function (err) {
        if (err)
            return next(err);
        req.session.destroy(() => {
            res.clearCookie('connect.sid'); // or your session cookie name
            res.status(200).json({ msg: 'Logged out successfully' });
        });
    });
});
router.delete('/delete', authMiddleware_1.isAuth, auth_1.DeleteUser);
exports.default = router;
