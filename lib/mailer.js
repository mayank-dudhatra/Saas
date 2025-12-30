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


// import { Resend } from 'resend';

// const resend = new Resend(process.env.RESEND_API_KEY);

// export const sendEmail = async ({ to, subject, html }) => {
//   try {
//     const data = await resend.emails.send({
//       // IMPORTANT: You must use 'onboarding@resend.dev' until you verify a custom domain in Resend
//       from: 'Agro SaaS <onboarding@resend.dev>', 
//       to: [to], 
//       subject: subject,
//       html: html,
//     });

//     if (data.error) {
//       console.error("Resend Error:", data.error);
//       throw new Error(data.error.message);
//     }

//     return data;

//   } catch (error) {
//     console.error("Error sending email:", error);
//     throw new Error("Failed to send email.");
//   }
// };