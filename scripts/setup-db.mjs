import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

async function setup() {
  const db = createClient({ url: "file:local.db" });

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

  const check = await db.execute("SELECT COUNT(*) as count FROM admins");
  if (check.rows[0].count === 0) {
    const hash = await bcrypt.hash("admin", 10);
    await db.execute({ sql: "INSERT INTO admins (username, password_hash) VALUES (?, ?)", args: ["admin", hash] });
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let secret = "";
    for (let i = 0; i < 32; i++) secret += chars[Math.floor(Math.random() * chars.length)];
    await db.execute({ sql: "INSERT INTO apps (admin_id, name, secret) VALUES (?, ?, ?)", args: [1, "Default App", secret] });
    console.log("Setup complete! Admin: admin/admin, App Secret:", secret);
  } else {
    console.log("Database already initialized.");
  }
}

setup().catch(console.error);
