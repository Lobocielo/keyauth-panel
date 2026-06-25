import { createClient, type Client } from "@libsql/client";

let client: Client | null = null;

export function getDb(): Client {
  if (!client) {
    client = createClient({
      url: process.env.DATABASE_URL || "file:local.db",
    });
  }
  return client;
}

export async function initDb() {
  const db = getDb();

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS apps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      secret TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (admin_id) REFERENCES admins(id)
    );

    CREATE TABLE IF NOT EXISTS end_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      hwid TEXT DEFAULT '',
      is_banned INTEGER DEFAULT 0,
      last_login TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (app_id) REFERENCES apps(id)
    );

    CREATE TABLE IF NOT EXISTS licenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL,
      license_key TEXT UNIQUE NOT NULL,
      type TEXT DEFAULT 'subscription',
      duration_days INTEGER DEFAULT 30,
      is_used INTEGER DEFAULT 0,
      used_by INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT,
      FOREIGN KEY (app_id) REFERENCES apps(id),
      FOREIGN KEY (used_by) REFERENCES end_users(id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      user_type TEXT NOT NULL DEFAULT 'admin',
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS login_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL,
      user_id INTEGER,
      username TEXT NOT NULL,
      ip_address TEXT DEFAULT '',
      success INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (app_id) REFERENCES apps(id)
    );
  `);

  const adminCheck = await db.execute({
    sql: "SELECT COUNT(*) as count FROM admins",
    args: [],
  });
  const count = (adminCheck.rows[0] as any).count;
  if (count === 0) {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("admin", 10);
    await db.execute({
      sql: "INSERT INTO admins (username, password_hash) VALUES (?, ?)",
      args: ["admin", hash],
    });
    const secret = generateAppSecret();
    await db.execute({
      sql: "INSERT INTO apps (admin_id, name, secret) VALUES (?, ?, ?)",
      args: [1, "Default App", secret],
    });
    console.log("Database initialized with default admin (admin/admin) and default app.");
    console.log("App Secret:", secret);
  }
}

function generateAppSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
