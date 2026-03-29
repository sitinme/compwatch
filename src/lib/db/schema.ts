export const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    plan TEXT DEFAULT 'free' CHECK(plan IN ('free', 'pro', 'business')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS magic_links (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS monitors (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    url TEXT NOT NULL,
    name TEXT,
    check_interval INTEGER DEFAULT 86400,
    last_checked_at DATETIME,
    last_changed_at DATETIME,
    change_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'error')),
    error_message TEXT,
    scrape_layer INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS snapshots (
    id TEXT PRIMARY KEY,
    monitor_id TEXT NOT NULL REFERENCES monitors(id),
    content_text TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS changes (
    id TEXT PRIMARY KEY,
    monitor_id TEXT NOT NULL REFERENCES monitors(id),
    snapshot_before_id TEXT REFERENCES snapshots(id),
    snapshot_after_id TEXT NOT NULL REFERENCES snapshots(id),
    diff_text TEXT NOT NULL,
    ai_summary TEXT,
    ai_category TEXT,
    ai_importance TEXT DEFAULT 'medium' CHECK(ai_importance IN ('critical', 'important', 'medium', 'minor')),
    ai_insight TEXT,
    notified_at DATETIME,
    user_feedback TEXT CHECK(user_feedback IN ('useful', 'not_useful', NULL)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS waitlist (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    source TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_magic_token ON magic_links(token);
  CREATE INDEX IF NOT EXISTS idx_monitors_user ON monitors(user_id);
  CREATE INDEX IF NOT EXISTS idx_snapshots_monitor ON snapshots(monitor_id);
  CREATE INDEX IF NOT EXISTS idx_changes_monitor ON changes(monitor_id);
  CREATE INDEX IF NOT EXISTS idx_changes_created ON changes(created_at);
`;
