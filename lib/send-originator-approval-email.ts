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

/**
 * Email an approved originator their PropReady-generated staff number for login.
 */
export async function sendOriginatorApprovalEmail(params: {
    email: string;
    fullName?: string;
    organizationName: string;
    staffNumber: string;
}): Promise<{ ok: boolean; error?: string }> {
    const resend = getResend();
    if (!resend) {
        console.warn('Originator approval email skipped: RESEND_API_KEY not configured', {
            to: params.email,
            staffNumber: params.staffNumber,
        });
        return { ok: false, error: 'RESEND_API_KEY not configured on the server' };
    }

    const fromEmail =
        process.env.RESEND_FROM_EMAIL?.trim() || 'PropReady <onboarding@resend.dev>';
    const greeting = params.fullName ? `Hi ${params.fullName},` : 'Hi there,';
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://prop-ready.co.za').replace(/\/$/, '');
    const loginUrl = `${appUrl}/originators/login`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Originator account approved</title></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #2C2C2C; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">You're approved</h1>
    <p style="color: white; margin: 10px 0 0; opacity: 0.9;">PropReady bond originator access</p>
  </div>
  <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">${greeting}</p>
    <p style="font-size: 16px;">PropReady has approved your staff account for <strong>${params.organizationName}</strong>.</p>
    <p style="font-size: 16px;">Use this staff number when you sign in:</p>
    <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 24px 0;">
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 3px; color: #DC2626; margin: 0; font-family: ui-monospace, monospace;">${params.staffNumber}</p>
    </div>
    <p style="font-size: 14px; color: #666;">Sign in with your work email, organisation, staff number, and password at:</p>
    <p style="font-size: 14px;"><a href="${loginUrl}" style="color: #DC2626;">${loginUrl}</a></p>
    <p style="font-size: 16px; margin-top: 24px;">Best regards,<br><strong>The PropReady Team</strong></p>
  </div>
</body>
</html>`;

    try {
        const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: params.email,
            subject: 'Your PropReady originator staff number',
            html,
        });

        if (error) {
            console.error('Resend originator approval email error:', error);
            return { ok: false, error: error.message || String(error) };
        }

        console.info('Originator approval email sent', {
            to: params.email,
            staffNumber: params.staffNumber,
            id: data?.id,
        });
        return { ok: true };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send approval email';
        console.error('Originator approval email threw:', err);
        return { ok: false, error: message };
    }
}
