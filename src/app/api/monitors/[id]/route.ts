import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getMonitorById, getChangesByMonitor, getDb } from '@/lib/db';

// GET /api/monitors/:id — get monitor details + changes
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const monitor = getMonitorById(id);
  if (!monitor || monitor.user_id !== session.user_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const changes = getChangesByMonitor(id, 50);
  return NextResponse.json({ monitor, changes });
}

// DELETE /api/monitors/:id — remove a monitor
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const monitor = getMonitorById(id);
  if (!monitor || monitor.user_id !== session.user_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Delete changes, snapshots, then monitor
  getDb().prepare('DELETE FROM changes WHERE monitor_id = ?').run(id);
  getDb().prepare('DELETE FROM snapshots WHERE monitor_id = ?').run(id);
  getDb().prepare('DELETE FROM monitors WHERE id = ?').run(id);

  return NextResponse.json({ message: 'Monitor deleted' });
}

// PATCH /api/monitors/:id — update monitor (pause/resume/rename)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const monitor = getMonitorById(id);
  if (!monitor || monitor.user_id !== session.user_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();

  if (body.status && ['active', 'paused'].includes(body.status)) {
    getDb().prepare('UPDATE monitors SET status = ? WHERE id = ?').run(body.status, id);
  }
  if (body.name) {
    getDb().prepare('UPDATE monitors SET name = ? WHERE id = ?').run(body.name, id);
  }

  return NextResponse.json({ message: 'Updated' });
}
