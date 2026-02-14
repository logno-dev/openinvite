import { Resend } from "resend";

type SendMailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
};

function getMailerConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
  return { apiKey, fromEmail, appUrl };
}

export function getAppUrl() {
  return getMailerConfig().appUrl;
}

export function isMailerConfigured() {
  const { apiKey, fromEmail } = getMailerConfig();
  return Boolean(apiKey && fromEmail);
}

export async function sendMail(input: SendMailInput) {
  const { apiKey, fromEmail } = getMailerConfig();
  if (!apiKey || !fromEmail) {
    throw new Error("Email provider is not configured");
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: fromEmail,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}
