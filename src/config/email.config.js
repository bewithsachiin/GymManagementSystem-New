import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// simple wrapper
export const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: `"Gym SaaS" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html
  });
};

// welcome email for Admin with login details
export const sendWelcomeAdminEmail = async ({ to, adminName, tempPassword }) => {
  const clientUrl = process.env.CLIENT_URL || '#';

  const html = `
    <h2>Welcome to Gym SaaS, ${adminName}</h2>
    <p>Your gym owner account has been created successfully.</p>
    <p><strong>Login details:</strong></p>
    <ul>
      <li>Email: <b>${to}</b></li>
      <li>Temporary Password: <b>${tempPassword}</b></li>
    </ul>
    <p>Please login and change your password from your profile or "Change Password" section.</p>
    <p>Login here: <a href="${clientUrl}">${clientUrl}</a></p>
    <br/>
    <p>Regards,<br/>Gym SaaS Team</p>
  `;

  await sendEmail({
    to,
    subject: 'Your Gym SaaS Admin Account',
    html
  });
};

