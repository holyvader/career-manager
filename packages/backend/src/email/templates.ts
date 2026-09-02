interface EmailContent {
  subject: string;
  text: string;
  html: string;
}

export function verificationEmailTemplate(url: string): EmailContent {
  return {
    subject: 'Verify your email address',
    text: `Welcome to Career Manager!\n\nPlease verify your email address by visiting the link below:\n${url}\n\nIf you did not create an account, you can safely ignore this email.`,
    html: `
      <p>Welcome to Career Manager!</p>
      <p>Please verify your email address by clicking the link below:</p>
      <p><a href="${url}">Verify email address</a></p>
      <p>If you did not create an account, you can safely ignore this email.</p>
    `,
  };
}

export function passwordResetEmailTemplate(url: string): EmailContent {
  return {
    subject: 'Reset your password',
    text: `We received a request to reset your Career Manager password.\n\nVisit the link below to choose a new one:\n${url}\n\nIf you did not request this, you can safely ignore this email.`,
    html: `
      <p>We received a request to reset your Career Manager password.</p>
      <p><a href="${url}">Choose a new password</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>
    `,
  };
}
