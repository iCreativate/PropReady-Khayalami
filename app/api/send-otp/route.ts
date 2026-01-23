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
        const { email, type } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP temporarily (in production, use Redis or database with expiry)
        if (typeof window === 'undefined') {
            // Server-side: Store in a temporary map or database
            // For now, we'll return it (in production, store securely)
        }

        let subject = '';
        let htmlContent = '';

        if (type === 'welcome') {
            subject = 'Welcome to PropReady!';
            htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Welcome to PropReady</title>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #2C2C2C; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0;">Welcome to PropReady!</h1>
                    </div>
                    <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                        <p style="font-size: 16px;">Hi there,</p>
                        <p style="font-size: 16px;">Thank you for joining PropReady! We're excited to help you on your property journey.</p>
                        <p style="font-size: 16px;">Get started by:</p>
                        <ul style="font-size: 16px;">
                            <li>Exploring our Learning Center</li>
                            <li>Taking the PropReady Quiz</li>
                            <li>Browsing available properties</li>
                            <li>Connecting with verified agents</li>
                        </ul>
                        <p style="font-size: 16px;">If you have any questions, feel free to reach out to our support team.</p>
                        <p style="font-size: 16px;">Best regards,<br>The PropReady Team</p>
                    </div>
                </body>
                </html>
            `;
        } else {
            subject = 'Your PropReady Login OTP';
            htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Login OTP</title>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #2C2C2C; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0;">Your Login Code</h1>
                    </div>
                    <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                        <p style="font-size: 16px;">Hi there,</p>
                        <p style="font-size: 16px;">You requested a login code for your PropReady account. Use the code below to complete your login:</p>
                        <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                            <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #DC2626; margin: 0;">${otp}</p>
                        </div>
                        <p style="font-size: 14px; color: #666;">This code will expire in 10 minutes. If you didn't request this code, please ignore this email.</p>
                        <p style="font-size: 16px;">Best regards,<br>The PropReady Team</p>
                    </div>
                </body>
                </html>
            `;
        }

        // Send email using Resend (if API key is configured)
        const resend = getResend();
        if (!resend) {
            // In development without API key, just return success with OTP
            console.warn('RESEND_API_KEY not configured. Email not sent, but OTP generated for development.');
            return NextResponse.json({
                success: true,
                message: 'OTP generated (email not sent - RESEND_API_KEY not configured)',
                otp: otp // Return OTP for development
            });
        }

        // Use verified domain if available, otherwise fall back to Resend's default
        // TODO: Replace 'yourdomain.com' with your actual verified domain
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'PropReady <onboarding@resend.dev>';
        
        console.log('Attempting to send email:', { from: fromEmail, to: email, type });

        const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: email,
            subject: subject,
            html: htmlContent,
        });

        if (error) {
            console.error('Resend error details:', JSON.stringify(error, null, 2));
            // Return detailed error information for debugging
            return NextResponse.json({
                success: false,
                message: 'Failed to send email',
                error: error.message || 'Email sending failed',
                errorDetails: error,
                otp: process.env.NODE_ENV === 'development' ? otp : undefined
            }, { status: 500 });
        }

        console.log('Email sent successfully:', data);

        // In production, store OTP in Redis/database with 10-minute expiry
        // For now, return OTP for verification (in production, use server-side verification)
        return NextResponse.json({
            success: true,
            message: 'OTP sent successfully',
            // Return OTP for client-side verification (in production, verify server-side)
            otp: otp
        });

    } catch (error: any) {
        console.error('Error sending OTP:', error);
        return NextResponse.json(
            { 
                error: 'Internal server error',
                message: error?.message || 'An unexpected error occurred',
                details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
            },
            { status: 500 }
        );
    }
}
