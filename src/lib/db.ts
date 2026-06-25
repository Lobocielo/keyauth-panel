const RAW_URL = process.env.DATABASE_URL || "";
const TURSO_URL = RAW_URL.replace("libsql://", "https://");
const TURSO_TOKEN = process.env.DATABASE_AUTH_TOKEN || "";

async function tursoExec(sql: string, args: any[] = []): Promise<any> {
  const url = `${TURSO_URL}/v1/execute`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TURSO_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      stmt: sql,
      args: args.map((a) => String(a)),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Turso API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const result = data.results?.[0];
  if (!result) return { rows: [] };

  if (result.message) {
    return { rows: [], lastInsertRowid: data.last_insert_rowid };
  }

  if (result.error_message) {
    throw new Error(`Turso error: ${result.error_message}`);
  }

  const cols = result.cols || [];
  const rows = (result.rows || []).map((row: any[]) => {
    const obj: Record<string, any> = {};
    cols.forEach((col: any, i: number) => {
      obj[col.name] = row[i];
    });
    return obj;
  });

  return {
    rows,
    lastInsertRowid: data.last_insert_rowid,
  };
}

let initialized = false;

export async function ensureDb() {
  if (initialized) return;

  await tursoExec(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  await tursoExec(`CREATE TABLE IF NOT EXISTS apps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    secret TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (admin_id) REFERENCES admins(id)
  )`);
  await tursoExec(`CREATE TABLE IF NOT EXISTS end_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    hwid TEXT DEFAULT '',
    is_banned INTEGER DEFAULT 0,
    last_login TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (app_id) REFERENCES apps(id)
  )`);
  await tursoExec(`CREATE TABLE IF NOT EXISTS licenses (
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
  )`);
  await tursoExec(`CREATE TABLE IF NOT EXISTS login_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_id INTEGER NOT NULL,
    user_id INTEGER,
    username TEXT NOT NULL,
    ip_address TEXT DEFAULT '',
    success INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (app_id) REFERENCES apps(id)
  )`);

  const check = await dbQuery("SELECT COUNT(*) as count FROM admins");
  const count = Number(check.rows[0]?.count || 0);
  if (count === 0) {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("admin", 10);
    await dbRun("INSERT INTO admins (username, password_hash) VALUES (?, ?)", ["admin", hash]);
    const secret = generateAppSecret();
    await dbRun("INSERT INTO apps (admin_id, name, secret) VALUES (?, ?, ?)", [1, "Default App", secret]);
    console.log("Database initialized. Default admin: admin/admin, App Secret:", secret);
  }

  initialized = true;
}

export async function dbQuery(sql: string, args: any[] = []) {
  return tursoExec(sql, args);
}

export async function dbRun(sql: string, args: any[] = []) {
  return tursoExec(sql, args);
}

function generateAppSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
