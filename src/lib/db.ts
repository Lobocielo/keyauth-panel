const RAW_URL = process.env.DATABASE_URL || "";
const TURSO_URL = RAW_URL.replace("libsql://", "https://");
const TURSO_TOKEN = process.env.DATABASE_AUTH_TOKEN || "";

async function tursoExec(sql: string, args: any[] = []): Promise<any> {
  const url = `${TURSO_URL}/v2/pipeline`;
  const stmt: any = { sql };
  if (args.length > 0) {
    stmt.args = args.map((a) => ({ type: "text", value: String(a) }));
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TURSO_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        { type: "execute", stmt },
        { type: "close" },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Turso API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const result = data.results?.[0];
  if (!result) return { rows: [] };

  if (result.type === "error") {
    throw new Error(`Turso error: ${result.error?.message || JSON.stringify(result.error)}`);
  }

  const res = result.response?.result;
  if (!res) return { rows: [] };

  const cols = res.cols || [];
  const rows = (res.rows || []).map((row: any[]) => {
    const obj: Record<string, any> = {};
    cols.forEach((col: any, i: number) => {
      const val = row[i]?.value ?? row[i];
      if (col.decltype === "INTEGER" && val !== null) {
        obj[col.name] = Number(val);
      } else {
        obj[col.name] = val;
      }
    });
    return obj;
  });

  return {
    rows,
    lastInsertRowid: res.last_insert_rowid,
  };
}

let initialized = false;

export async function ensureDb() {
  if (initialized) return;

  const tables = [
    `CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS apps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      secret TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (admin_id) REFERENCES admins(id)
    )`,
    `CREATE TABLE IF NOT EXISTS end_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      hwid TEXT DEFAULT '',
      is_banned INTEGER DEFAULT 0,
      last_login TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (app_id) REFERENCES apps(id)
    )`,
    `CREATE TABLE IF NOT EXISTS licenses (
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
    )`,
    `CREATE TABLE IF NOT EXISTS login_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL,
      user_id INTEGER,
      username TEXT NOT NULL,
      ip_address TEXT DEFAULT '',
      success INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (app_id) REFERENCES apps(id)
    )`,
  ];

  for (const table of tables) {
    await tursoExec(table);
  }

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
