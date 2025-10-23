import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create a transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

// Function to send email
export async function sendVerificationEmail(username: string, email: string, verificationToken: string): Promise<void> {
    const mailOptions = {
        from: `noreply@casatrain.com`,
        to: email, // TODO: Replace this with email later
        subject: 'Casatrain: Your Verification Code',
        html: `<p>Hello ${username},</p><p>This is your verification code: ${verificationToken}</p>`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${email}`);
    } catch (error) {
        console.error(`Failed to send verification email to ${email}:`, error);
        throw new Error('Failed to send verification email');
    }
}

export async function sendPasswordResetEmail(username: string, email: string, resetToken: string): Promise<void> {
    const mailOptions = {
        from: `noreply@casatrain.com`,
        to: email, // Can only send to emails that are verified on SES for now
        subject: 'Casatrain: Password Reset',
        html: `<p>Hello ${username},</p><p>Use this reset code to reset your password: <strong>${resetToken}</strong></p><p>This code is valid for 15 minutes.</p>`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to ${email}`);
    } catch (error) {
        console.error(`Failed to send password reset email to ${email}:`, error);
        throw new Error('Failed to send password reset email');
    }
}

export async function sendNotificationEmail(username: string, email: string, message: string): Promise<void> {
    const mailOptions = {
        from: `noreply@casatrain.com`,
        to: email,
        subject: 'Notification From Casatrain!',
        html: `<p>Hello ${username},</p><p>${message}</p>`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Notification email sent to ${email}`);
    } catch (error) {
        console.error(`Failed to send notification email to ${email}:`, error);
        throw new Error('Failed to send notification email');
    }
}
