import { NextResponse } from 'next/server';
import { getSession, getPlanLimits } from '@/lib/auth';
import { getMonitorsByUser, createMonitor, countMonitorsByUser, getDb } from '@/lib/db';

// GET /api/monitors — list user's monitors
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const monitors = getMonitorsByUser(session.user_id);

  // Enrich with latest change info
  const enriched = monitors.map((m: any) => {
    const lastChange = getDb().prepare('SELECT ai_summary, ai_category, ai_importance, created_at FROM changes WHERE monitor_id = ? ORDER BY created_at DESC LIMIT 1').get(m.id) as any;
    return { ...m, lastChange: lastChange || null };
  });

  return NextResponse.json({ monitors: enriched });
}

// POST /api/monitors — add a new monitor
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { url, name } = await request.json();

  if (!url || !url.startsWith('http')) {
    return NextResponse.json({ error: 'Valid URL required (must start with http)' }, { status: 400 });
  }

  // Check plan limits
  const limits = getPlanLimits(session.plan);
  const currentCount = countMonitorsByUser(session.user_id);
  if (currentCount >= limits.maxMonitors) {
    return NextResponse.json({
      error: `You've reached the ${limits.maxMonitors}-page limit on the ${session.plan} plan. Upgrade to monitor more pages.`,
    }, { status: 403 });
  }

  try {
    const monitorId = createMonitor(session.user_id, url, name);
    return NextResponse.json({ id: monitorId, message: 'Monitor added! First check will run shortly.' }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to add monitor' }, { status: 500 });
  }
}
