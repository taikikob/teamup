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
exports.handleResetPassword = exports.handleForgotPassword = exports.resendVerificationEmailHandler = void 0;
exports.postSignup = postSignup;
exports.isUsernameUnique = isUsernameUnique;
exports.verifyEmailHandler = verifyEmailHandler;
exports.DeleteUser = DeleteUser;
const db_1 = __importDefault(require("../db"));
const passwordUtils_1 = require("../lib/passwordUtils");
const crypto_1 = __importDefault(require("crypto"));
const nodeMailer_1 = require("../nodeMailer");
function postSignup(request, response) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { firstName, lastName, username, email, password } = request.body;
            if (!firstName || !lastName || !username || !email || !password) {
                response.status(400).json({ error: "Missing required fields" });
                return;
            }
            const saltHash = (0, passwordUtils_1.genPassword)(password);
            const salt = saltHash.salt;
            const hash = saltHash.hash;
            // Generate a random verification token
            const verificationToken = crypto_1.default.randomBytes(3).toString("hex");
            // Set token to expire in 15 minutes
            const verificationTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
            // Check if unverified username already exists
            const client = yield db_1.default.connect();
            yield client.query("BEGIN");
            const existingUser = yield client.query("SELECT user_id FROM users WHERE username = $1 AND verified = $2", [username, false]);
            if (existingUser.rows.length > 0) {
                // Delete the existing unverified user
                yield client.query("DELETE FROM users WHERE user_id = $1", [existingUser.rows[0].user_id]);
            }
            yield client.query("INSERT INTO users (username, password_hash, salt, email, first_name, last_name, verification_token, verification_token_expires_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)", [username, hash, salt, email, firstName, lastName, verificationToken, verificationTokenExpiresAt]);
            yield client.query("COMMIT");
            client.release();
            yield (0, nodeMailer_1.sendVerificationEmail)(username, email, verificationToken);
            response.status(201).json({ message: "Signup successful. Please verify your email now." });
            return;
        }
        catch (error) {
            // Postgres unique_violation error code is 23505
            if (error.code === '23505') {
                response.status(409).json({ error: "Username already exists" });
                return;
            }
            console.error(error);
            response.status(500).json({ error: "Signup failed" });
            return;
        }
    });
}
function isUsernameUnique(request, response) {
    return __awaiter(this, void 0, void 0, function* () {
        const { username } = request.query;
        if (typeof username !== 'string' || username.trim() === '') {
            response.status(400).json({ isUnique: false, error: "Invalid username" });
            return;
        }
        try {
            const result = yield db_1.default.query(`
            SELECT 1 FROM users 
            WHERE username = $1 AND verified = $2`, [username, true]);
            const isUnique = result.rows.length === 0;
            response.json({ isUnique });
        }
        catch (error) {
            console.error("Database error during username uniqueness check:", error);
            response.status(500).json({ isUnique: false, error: "Internal Server Error" });
        }
    });
}
function verifyEmailHandler(request, response) {
    return __awaiter(this, void 0, void 0, function* () {
        const { code } = request.body;
        if (!code || typeof code !== 'string') {
            response.status(400).json({ message: "Invalid verification code" });
            return;
        }
        try {
            // Find user with the provided verification token
            console.log("Verifying email with code:", code);
            const now = new Date();
            const result = yield db_1.default.query("SELECT user_id FROM users WHERE verification_token = $1 AND verification_token_expires_at > $2", [code, now]);
            console.log("Verification result:", result.rows);
            if (result.rows.length === 0) {
                response.status(400).json({ message: "Invalid or expired verification code" });
                return;
            }
            const userId = result.rows[0].user_id;
            // Update user's email verification status
            yield db_1.default.query("UPDATE users SET verified = TRUE, verification_token = NULL, verification_token_expires_at = NULL WHERE user_id = $1", [userId]);
            response.status(200).json({ message: "Email verified successfully, you can log in now." });
        }
        catch (error) {
            console.error("Error verifying email:", error);
            response.status(500).json({ message: "Internal server error" });
        }
    });
}
const resendVerificationEmailHandler = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, username } = request.body;
    if (!email || typeof email !== 'string' || email.trim() === '') {
        response.status(400).json({ message: "Invalid email address" });
        return;
    }
    if (!username || typeof username !== 'string' || username.trim() === '') {
        response.status(400).json({ message: "Invalid username" });
        return;
    }
    try {
        // Find user with the provided email who is not yet verified
        const result = yield db_1.default.query("SELECT user_id FROM users WHERE email = $1 AND verified = $2", [email, false]);
        if (result.rows.length === 0) {
            response.status(400).json({ message: "No unverified account found with that email" });
            return;
        }
        const userId = result.rows[0].user_id;
        // Generate a new verification token
        const verificationToken = crypto_1.default.randomBytes(3).toString("hex");
        // Set token to expire in 15 minutes
        const verificationTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
        // Update the user's verification token in the database
        yield db_1.default.query("UPDATE users SET verification_token = $1, verification_token_expires_at = $2 WHERE user_id = $3", [verificationToken, verificationTokenExpiresAt, userId]);
        // Send the new verification email
        yield (0, nodeMailer_1.sendVerificationEmail)(username, email, verificationToken);
        response.status(200).json({ message: "Verification email resent. Please check your email." });
    }
    catch (error) {
        console.error("Error resending verification email:", error);
        response.status(500).json({ message: "Internal server error" });
    }
});
exports.resendVerificationEmailHandler = resendVerificationEmailHandler;
const handleForgotPassword = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email } = request.body;
    // verify username and email are provided
    if (!username || typeof username !== 'string' || username.trim() === '') {
        response.status(400).json({ message: "Invalid username" });
        return;
    }
    if (!email || typeof email !== 'string' || email.trim() === '') {
        response.status(400).json({ message: "Invalid email address" });
        return;
    }
    try {
        // Find user with the provided username and email
        const result = yield db_1.default.query("SELECT user_id FROM users WHERE email = $1 AND username = $2", [email, username]);
        if (result.rows.length === 0) {
            response.status(404).json({ message: "User with provided username and email not found" });
            return;
        }
        const userId = result.rows[0].user_id;
        // Generate a password reset token
        const resetToken = crypto_1.default.randomBytes(3).toString("hex");
        // Set token to expire in 15 minutes
        const resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
        // Update the user's reset token in the database
        yield db_1.default.query("UPDATE users SET reset_password_token = $1, reset_password_token_expires_at = $2 WHERE user_id = $3", [resetToken, resetTokenExpiresAt, userId]);
        // Send the password reset email
        yield (0, nodeMailer_1.sendPasswordResetEmail)(username, email, resetToken);
        response.status(200).json({ message: "Password reset email sent. Please check your email." });
    }
    catch (error) {
        console.error("Error handling forgot password:", error);
        response.status(500).json({ message: "Internal server error" });
    }
});
exports.handleForgotPassword = handleForgotPassword;
const handleResetPassword = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, code, newPassword } = request.body;
    // verify username, code and newPassword are provided
    if (!username || typeof username !== 'string' || username.trim() === '') {
        response.status(400).json({ message: "Invalid username" });
        return;
    }
    if (!code || typeof code !== 'string' || code.trim() === '') {
        response.status(400).json({ message: "Invalid reset code" });
        return;
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim() === '') {
        response.status(400).json({ message: "New password is required" });
        return;
    }
    try {
        // Find user with the provided reset token
        const now = new Date();
        const result = yield db_1.default.query("SELECT user_id FROM users WHERE reset_password_token = $1 AND reset_password_token_expires_at > $2", [code, now]);
        if (result.rows.length === 0) {
            response.status(400).json({ message: "Invalid or expired reset code" });
            return;
        }
        const userId = result.rows[0].user_id;
        // Generate a new password hash
        const saltHash = (0, passwordUtils_1.genPassword)(newPassword);
        const salt = saltHash.salt;
        const hash = saltHash.hash;
        // Update the user's password and clear the reset token
        yield db_1.default.query("UPDATE users SET password_hash = $1, salt = $2, reset_password_token = NULL, reset_password_token_expires_at = NULL WHERE user_id = $3", [hash, salt, userId]);
        response.status(200).json({ message: "Password reset successful. You can now log in with your new password." });
    }
    catch (error) {
        console.error("Error resetting password:", error);
        response.status(500).json({ message: "Internal server error" });
    }
});
exports.handleResetPassword = handleResetPassword;
function DeleteUser(request, response) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = request.user;
        if (!user) {
            response.status(401).json({ error: 'User not authenticated' });
            return;
        }
        const userId = user.user_id;
        try {
            yield db_1.default.query("DELETE FROM users WHERE user_id = $1", [userId]);
            request.logout(function (err) {
                if (err) {
                    console.error("Error logging out after account deletion:", err);
                }
                request.session.destroy(() => {
                    response.clearCookie('connect.sid'); // or your session cookie name
                    response.status(200).json({ msg: 'Account deleted successfully' });
                });
            });
        }
        catch (error) {
            console.error("Error deleting user account:", error);
            response.status(500).json({ error: 'Internal server error' });
        }
    });
}
