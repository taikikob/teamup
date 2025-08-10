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
        to: email,
        subject: 'Your Verification Code',
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
    // send a password reset link to the user's email
    const resetUrl = `http://localhost:3000/api/auth/reset-password?token=${resetToken}`;

    const mailOptions = {
        from: `noreply@casatrain.com`,
        to: email,
        subject: 'Password Reset',
        html: `<p>Hello ${username},</p><p>Use this token to reset your password: <strong>${resetToken}</strong></p><p>This token is valid for 15 minutes.</p>>`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to ${email}`);
    } catch (error) {
        console.error(`Failed to send password reset email to ${email}:`, error);
        throw new Error('Failed to send password reset email');
    }
}
