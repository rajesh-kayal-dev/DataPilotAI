import nodemailer from "nodemailer";

export const sendVerificationEmail = async (email, token, name) => {
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const verificationLink = `http://localhost:5000/api/auth/verify/${token}`;

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #4F46E5;">Welcome to DataPilotAI, ${name}!</h2>
      </div>
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
        <h3 style="color: #333;">Verify Your Email</h3>
        <p>Thank you for signing up with DataPilotAI. To complete your registration, please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${verificationLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
        </div>
        <p>If you didn't create an account with DataPilotAI, you can safely ignore this email.</p>
      </div>
      <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #666;">
        <p>© 2026 DataPilotAI. All rights reserved.</p>
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