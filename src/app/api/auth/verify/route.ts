import { NextResponse } from 'next/server';
import { verifyMagicLink, createSession, setSessionCookie } from '@/lib/auth';
import { getUserByEmail, createUser } from '@/lib/db';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=missing_token', request.url));
  }

  const email = verifyMagicLink(token);
  if (!email) {
    return NextResponse.redirect(new URL('/login?error=invalid_or_expired', request.url));
  }

  // Find or create user
  let user = getUserByEmail(email);
  if (!user) {
    const userId = createUser(email);
    user = { id: userId, email };
  }

  // Create session
  const sessionId = createSession(user.id);
  await setSessionCookie(sessionId);

  return NextResponse.redirect(new URL('/dashboard', request.url));
}
