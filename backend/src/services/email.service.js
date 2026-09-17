const nodemailer = require("nodemailer");


function createTransporter() {

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
        return null;
    }

    return nodemailer.createTransport({
        host: smtpHost,
        port: Number(smtpPort),
        secure: Number(smtpPort) === 465,
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    });

}


async function sendVerificationEmail(recipientEmail, otp) {

    const subject = "Verify your email - Resolvo Complaint Engine";

    const textContent = `Welcome to Resolvo!\n\nYour 6-digit verification code is: ${otp}\n\nThis code is valid for 10 minutes. Please do not share it with anyone.`;

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
            <h2 style="color: #4f46e5; margin-bottom: 8px;">Resolvo Engine</h2>
            <p style="color: #475569; font-size: 15px;">Thank you for registering. Please verify your email address to activate your account.</p>
            <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; text-align: center; margin: 20px 0;">
                <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #1e293b;">${otp}</span>
            </div>
            <p style="color: #64748b; font-size: 13px;">This OTP will expire in 10 minutes. If you did not request this, you can ignore this email.</p>
        </div>
    `;

    const transporter = createTransporter();

    if (!transporter) {

        console.log(`[EMAIL SERVICE DEV] Verification OTP for ${recipientEmail}: ${otp}`);

        return {
            delivered: true,
            mode: "development_logger",
        };

    }

    try {

        const fromAddress = process.env.FROM_EMAIL || `"Resolvo Support" <${process.env.SMTP_USER}>`;

        await transporter.sendMail({
            from: fromAddress,
            to: recipientEmail,
            subject: subject,
            text: textContent,
            html: htmlContent,
        });

        return {
            delivered: true,
            mode: "smtp",
        };

    } catch (error) {

        console.error("Failed to deliver email via SMTP:", error.message);

        return {
            delivered: false,
            error: error.message,
        };

    }

}


module.exports = {
    sendVerificationEmail,
};
