import 'server-only';
import nodemailer, { type Transporter } from 'nodemailer';

/**
 * SMTP via Nodemailer. Configure in .env:
 *   SMTP_HOST, SMTP_PORT (465 = TLS, 587 = STARTTLS), SMTP_USER, SMTP_PASS, MAIL_FROM
 * e.g. MAIL_FROM="Apna Waqeel <no-reply@yourdomain.com>"
 */
let transporter: Transporter | null = null;

function getTransporter() {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        throw new Error('Email is not configured: set SMTP_HOST, SMTP_USER and SMTP_PASS');
    }
    if (!transporter) {
        const port = Number(SMTP_PORT || 587);
        transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port,
            secure: port === 465,
            requireTLS: port !== 465,
            auth: { user: SMTP_USER, pass: SMTP_PASS },
        });
    }
    return transporter;
}

export async function sendMail(message: { to: string; subject: string; text: string; html: string }) {
    const from = process.env.MAIL_FROM || process.env.SMTP_USER!;
    await getTransporter().sendMail({ from, ...message });
}
