import nodemailer from "nodemailer";

export async function sendVerificationCode(toEmail, code) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  console.log(`[email] sending code to: ${toEmail}`);
  const info = await transporter.sendMail({
    from: `"SustainMart" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your SustainMart verification code",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:2rem">
        <h2 style="color:#0f766e;margin-top:0">Verify your email</h2>
        <p>Thank you for registering at SustainMart! Your verification code is:</p>
        <div style="font-size:2.5rem;font-weight:700;letter-spacing:.5rem;color:#0f766e;
                    text-align:center;margin:1.5rem 0;padding:1rem;
                    background:#ecfdf5;border-radius:.5rem">${code}</div>
        <p style="color:#64748b;font-size:.9rem">
          This code expires in 10 minutes.
          If you did not register, you can safely ignore this email.
        </p>
      </div>
    `,
  });
  console.log(`[email] accepted by Gmail, messageId: ${info.messageId}`);
}
