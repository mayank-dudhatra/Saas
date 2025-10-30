import nodemailer from 'nodemailer';

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: process.env.EMAIL_SERVER_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    const mailOptions = {
      from: `Your App <${process.env.EMAIL_FROM}>`,
      to: to,
      subject: subject,
      html: html,
    };

    const mailResponse = await transporter.sendMail(mailOptions);
    return mailResponse;

  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email.");
  }
};