import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { getDb, genId } from './db';

const SESSION_COOKIE = 'cw_session';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds
const MAGIC_LINK_EXPIRY = 15 * 60; // 15 minutes

// ===== Magic Link =====
export function createMagicLink(email: string) {
  const id = genId();
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY * 1000).toISOString();

  getDb().prepare('INSERT INTO magic_links (id, email, token, expires_at) VALUES (?, ?, ?, ?)').run(id, email.toLowerCase(), token, expiresAt);

  return token;
}

export function verifyMagicLink(token: string) {
  const link = getDb().prepare('SELECT * FROM magic_links WHERE token = ? AND used = 0 AND expires_at > datetime(?)').get(token, new Date().toISOString()) as any;

  if (!link) return null;

  // Mark as used
  getDb().prepare('UPDATE magic_links SET used = 1 WHERE id = ?').run(link.id);

  return link.email as string;
}

// ===== Sessions =====
export function createSession(userId: string) {
  const id = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();

  getDb().prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(id, userId, expiresAt);

  return id;
}

export async function getSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const session = getDb().prepare(`
    SELECT s.*, u.email, u.name, u.plan 
    FROM sessions s JOIN users u ON s.user_id = u.id 
    WHERE s.id = ? AND s.expires_at > datetime(?)
  `).get(sessionId, new Date().toISOString()) as any;

  return session;
}

export async function setSessionCookie(sessionId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    getDb().prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
  }
  cookieStore.delete(SESSION_COOKIE);
}

// ===== Plan Limits =====
export function getPlanLimits(plan: string) {
  switch (plan) {
    case 'pro': return { maxMonitors: 25, checkInterval: 6 * 3600, aiAnalysis: true, historyDays: 90 };
    case 'business': return { maxMonitors: 100, checkInterval: 3600, aiAnalysis: true, historyDays: -1 };
    default: return { maxMonitors: 5, checkInterval: 86400, aiAnalysis: false, historyDays: 7 };
  }
}
