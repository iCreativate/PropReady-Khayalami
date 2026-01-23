import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Lazy initialization to avoid build-time errors
const getResend = () => {
    if (!process.env.RESEND_API_KEY) return null;
    try {
        return new Resend(process.env.RESEND_API_KEY);
    } catch {
        return null;
    }
};

export async function POST(request: NextRequest) {
    try {
        const { email, fullName } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to PropReady</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #2C2C2C; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to PropReady!</h1>
                    <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Your Home. Ready.</p>
                </div>
                <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                    <p style="font-size: 18px; margin-bottom: 20px;">Hi ${fullName || 'there'},</p>
                    <p style="font-size: 16px; margin-bottom: 20px;">Thank you for joining PropReady! We're excited to help you on your property journey.</p>
                    <p style="font-size: 16px; margin-bottom: 20px;"><strong>Get started by:</strong></p>
                    <ul style="font-size: 16px; margin-bottom: 20px; padding-left: 20px;">
                        <li style="margin-bottom: 10px;">Exploring our Learning Center</li>
                        <li style="margin-bottom: 10px;">Taking the PropReady Quiz</li>
                        <li style="margin-bottom: 10px;">Browsing available properties</li>
                        <li style="margin-bottom: 10px;">Connecting with verified agents</li>
                    </ul>
                    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
                        <p style="font-size: 14px; color: #666; margin: 0;"><strong>100% Free</strong> for buyers and sellers</p>
                    </div>
                    <p style="font-size: 16px; margin-bottom: 20px;">If you have any questions, feel free to reach out to our support team.</p>
                    <p style="font-size: 16px; margin-top: 30px;">Best regards,<br><strong>The PropReady Team</strong></p>
                </div>
            </body>
            </html>
        `;

        // Send email using Resend (if API key is configured)
        const resend = getResend();
        if (!resend) {
            // In development without API key, just return success
            console.warn('RESEND_API_KEY not configured. Welcome email not sent.');
            return NextResponse.json({
                success: true,
                message: 'Welcome email would be sent (RESEND_API_KEY not configured)'
            });
        }

        // Use verified domain if available, otherwise fall back to Resend's default
        // TODO: Replace 'yourdomain.com' with your actual verified domain
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'PropReady <onboarding@resend.dev>';
        
        console.log('Attempting to send welcome email:', { from: fromEmail, to: email });

        const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: email,
            subject: 'Welcome to PropReady - Your Home. Ready.',
            html: htmlContent,
        });

        if (error) {
            console.error('Resend error details:', JSON.stringify(error, null, 2));
            return NextResponse.json(
                { 
                    error: 'Failed to send welcome email',
                    message: error.message || 'Email sending failed',
                    errorDetails: error
                },
                { status: 500 }
            );
        }

        console.log('Welcome email sent successfully:', data);

        return NextResponse.json({
            success: true,
            message: 'Welcome email sent successfully'
        });

    } catch (error) {
        console.error('Error sending welcome email:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
