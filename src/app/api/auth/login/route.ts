import { NextResponse } from 'next/server';
import { createMagicLink } from '@/lib/auth';
import { sendEmail } from '@/lib/email/send';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const token = createMagicLink(email.toLowerCase().trim());
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verifyUrl = `${appUrl}/api/auth/verify?token=${token}`;

    // Send magic link email
    const hasResend = !!process.env.RESEND_API_KEY;
    if (hasResend) {
      await sendEmail(email, '🔑 Sign in to CompWatch', `
        <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:24px;">
          <h2 style="color:#4F46E5;">Sign in to CompWatch</h2>
          <p>Click the button below to sign in. This link expires in 15 minutes.</p>
          <a href="${verifyUrl}" style="display:inline-block;background:#4F46E5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Sign In →</a>
          <p style="color:#999;font-size:12px;margin-top:24px;">If you didn't request this, ignore this email.</p>
        </div>
      `);
    }

    return NextResponse.json({
      message: hasResend
        ? 'Check your email for the sign-in link!'
        : 'Email not configured. Dev mode link:',
      // In dev mode without Resend, return the link directly
      ...(hasResend ? {} : { devLink: verifyUrl }),
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
