import nodemailer from "nodemailer";

/**
 * Transporter configuration shared across emails
 */
const getTransporter = () => nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (email, token, name) => {
  const transporter = getTransporter();
  const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #9B6FCC;">Welcome to DataPilotAI, ${name}!</h2>
      </div>
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
        <h3 style="color: #333;">Verify Your Email</h3>
        <p>Thank you for signing up with DataPilotAI. To complete your registration, please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${verificationLink}" style="background-color: #9B6FCC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
        </div>
        <p>If you didn't create an account with DataPilotAI, you can safely ignore this email.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"DataPilotAI Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Email Address",
    html: htmlTemplate,
  });
};

export const sendPaymentSuccessEmail = async (email, name, planName) => {
  const transporter = getTransporter();
  const dashboardLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`;

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #9B6FCC;">Payment Successful! 🚀</h2>
      </div>
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid #9B6FCC;">
        <p>Hi ${name},</p>
        <p>Great news! Your payment for the <strong>${planName}</strong> plan has been successfully processed.</p>
        <p><strong>What happens now?</strong></p>
        <ul>
          <li>Access to Premium AI Models unlocked</li>
          <li>Unlimited document processing active</li>
          <li>Unlimited workspace creation enabled</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardLink}" style="background-color: #9B6FCC; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Go to Dashboard</a>
        </div>
        <p style="font-size: 13px; color: #666;">If you have any questions, just reply to this email.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"DataPilotAI Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Your DataPilotAI Upgrade was Successful!`,
    html: htmlTemplate,
  });
};