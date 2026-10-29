const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../config/logger');

const hasSmtpConfig = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
const hasGmailConfig = Boolean(env.EMAIL_USER && env.EMAIL_PASS);

let transporter = null;

if (hasSmtpConfig) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT || 587,
    secure: env.SMTP_SECURE === 'true',
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS }
  });
} else if (hasGmailConfig) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASS }
  });
}

const sendMail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    logger.warn({ to, subject }, 'SMTP não configurado; e-mail não enviado (modo desenvolvimento)');
    return { skipped: true };
  }

  const info = await transporter.sendMail({
    from: env.emailFrom,
    to,
    subject,
    html,
    text
  });

  logger.info({ messageId: info.messageId, to }, 'E-mail enviado');
  return info;
};

const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const safeName = name || 'cliente';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
      <div style="background: linear-gradient(135deg,#4c1084,#e0116c,#ff7131); padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">Patrify</h1>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: 0; padding: 28px; border-radius: 0 0 12px 12px;">
        <p>Olá, <strong>${safeName}</strong>.</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
        <p style="text-align: center; margin: 28px 0;">
          <a href="${resetUrl}" style="background: #4c1084; color: #fff; padding: 12px 22px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Redefinir minha senha
          </a>
        </p>
        <p style="font-size: 13px; color: #6b7280;">Este link expira em 15 minutos. Se você não solicitou a alteração, ignore este e-mail.</p>
        <p style="font-size: 12px; color: #9ca3af; word-break: break-all;">${resetUrl}</p>
      </div>
    </div>
  `;

  return sendMail({
    to,
    subject: 'Recuperação de senha - Patrify',
    html,
    text: `Olá, ${safeName}. Acesse o link para redefinir sua senha (expira em 15 minutos): ${resetUrl}`
  });
};

module.exports = { sendMail, sendPasswordResetEmail, isMailConfigured: Boolean(transporter) };
