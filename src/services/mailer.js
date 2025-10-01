// src/services/mailer.js
import nodemailer from "nodemailer";

const {
  MAIL_PROVIDER,
  MAIL_FROM,
  MAIL_TO,
  GMAIL_USER,
  GMAIL_APP_PASSWORD,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
} = process.env;

function getTransporter() {
  if (MAIL_PROVIDER === "gmail") {
    return nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: GMAIL_USER || MAIL_FROM,
        pass: GMAIL_APP_PASSWORD,
      },
      logger: true,
      debug: true,
    });
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 587),
    secure: String(SMTP_SECURE ?? "false") === "true",
    auth:
      SMTP_USER && SMTP_PASS
        ? { user: SMTP_USER, pass: SMTP_PASS }
        : undefined,
    logger: true,
    debug: true,
  });
}

export async function sendContactMail({ name, email, phone, subject, message }) {
  const transporter = getTransporter();

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#222">
      <h2 style="color:#0e7490;margin:0 0 8px">Nuevo mensaje de contacto</h2>
      <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Teléfono:</strong> ${escapeHtml(phone || "-")}</p>
      <p><strong>Asunto:</strong> ${escapeHtml(subject)}</p>
      <hr/>
      <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
    </div>
  `;

  const text = [
    `Nuevo mensaje de contacto`,
    `Nombre: ${name}`,
    `Email: ${email}`,
    `Teléfono: ${phone || "-"}`,
    `Asunto: ${subject}`,
    ``,
    message,
  ].join("\n");

  const info = await transporter.sendMail({
    from: MAIL_FROM,
    to: MAIL_TO,
    replyTo: email || MAIL_FROM,
    subject: `[EMA Contact] ${subject}`,
    text,
    html,
  });

  return info;
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
