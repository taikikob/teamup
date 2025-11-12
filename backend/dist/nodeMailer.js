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
exports.sendVerificationEmail = sendVerificationEmail;
exports.sendPasswordResetEmail = sendPasswordResetEmail;
exports.sendNotificationEmail = sendNotificationEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Create a transporter
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});
// Function to send email
function sendVerificationEmail(username, email, verificationToken) {
    return __awaiter(this, void 0, void 0, function* () {
        const mailOptions = {
            from: `noreply@casatrain.com`,
            to: email, // TODO: Replace this with email later
            subject: 'Casatrain: Your Verification Code',
            html: `<p>Hello ${username},</p><p>This is your verification code: ${verificationToken}</p>`
        };
        try {
            yield transporter.sendMail(mailOptions);
            console.log(`Verification email sent to ${email}`);
        }
        catch (error) {
            console.error(`Failed to send verification email to ${email}:`, error);
            throw new Error('Failed to send verification email');
        }
    });
}
function sendPasswordResetEmail(username, email, resetToken) {
    return __awaiter(this, void 0, void 0, function* () {
        const mailOptions = {
            from: `noreply@casatrain.com`,
            to: email, // Can only send to emails that are verified on SES for now
            subject: 'Casatrain: Password Reset',
            html: `<p>Hello ${username},</p><p>Use this reset code to reset your password: <strong>${resetToken}</strong></p><p>This code is valid for 15 minutes.</p>`
        };
        try {
            yield transporter.sendMail(mailOptions);
            console.log(`Password reset email sent to ${email}`);
        }
        catch (error) {
            console.error(`Failed to send password reset email to ${email}:`, error);
            throw new Error('Failed to send password reset email');
        }
    });
}
function sendNotificationEmail(username, email, message) {
    return __awaiter(this, void 0, void 0, function* () {
        const mailOptions = {
            from: `noreply@casatrain.com`,
            to: email,
            subject: 'Notification From Casatrain!',
            html: `<p>Hello ${username},</p><p>${message}</p>`
        };
        try {
            yield transporter.sendMail(mailOptions);
            console.log(`Notification email sent to ${email}`);
        }
        catch (error) {
            console.error(`Failed to send notification email to ${email}:`, error);
            throw new Error('Failed to send notification email');
        }
    });
}
