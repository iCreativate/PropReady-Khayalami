import { Resend } from 'resend';

function getResend() {
    const key = process.env.RESEND_API_KEY?.trim();
    if (!key) return null;
    try {
        return new Resend(key);
    } catch {
        return null;
    }
}

function friendlyResendError(message: string): string {
    const m = message || '';
    if (/testing email|domains like|only send.*your own/i.test(m)) {
        return 'Email provider is in test mode. Verify your domain in Resend, or send only to the Resend account email.';
    }
    if (/not verified|unverified|domain/i.test(m)) {
        return 'Sending domain is not verified in Resend. Verify the domain used in RESEND_FROM_EMAIL, then try again.';
    }
    if (/invalid.*from|from.*field/i.test(m)) {
        return 'RESEND_FROM_EMAIL is invalid. Use a verified sender like PropReady <noreply@your-domain.com>.';
    }
    return m || 'Failed to send verification email';
}

export async function sendVerificationEmail(
    email: string,
    code: string,
    fullName?: string
): Promise<{ ok: boolean; error?: string }> {
    const resend = getResend();
    if (!resend) {
        return { ok: false, error: 'RESEND_API_KEY not configured on the server' };
    }

    const fromEmail =
        process.env.RESEND_FROM_EMAIL?.trim() || 'PropReady <onboarding@resend.dev>';
    const greeting = fullName ? `Hi ${fullName},` : 'Hi there,';

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Verify your email</title></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #2C2C2C; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Verify your email</h1>
    <p style="color: white; margin: 10px 0 0; opacity: 0.9;">PropReady — Your Home. Ready.</p>
  </div>
  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">${greeting}</p>
    <p style="font-size: 16px;">Enter this code on the verification page to activate your account and sign in:</p>
    <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 24px 0;">
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #DC2626; margin: 0;">${code}</p>
    </div>
    <p style="font-size: 14px; color: #666;">This code expires in 15 minutes. If you did not create an account, you can ignore this email.</p>
    <p style="font-size: 16px; margin-top: 24px;">Best regards,<br><strong>The PropReady Team</strong></p>
  </div>
</body>
</html>`;

    try {
        const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: email,
            subject: 'Verify your PropReady account',
            html,
        });

        if (error) {
            console.error('Resend verification email error:', error);
            return { ok: false, error: friendlyResendError(error.message || String(error)) };
        }

        console.info('Verification email sent', { to: email, id: data?.id });
        return { ok: true };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send verification email';
        console.error('Resend verification email threw:', err);
        return { ok: false, error: friendlyResendError(message) };
    }
}
