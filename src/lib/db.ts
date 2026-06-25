const GIST_ID = process.env.GIST_ID || "211a9502e310ec848c1fe8c1c5a51258";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";

export interface GistDB {
  apps: any[];
  admins: any[];
  resellers: any[];
  licenses: any[];
  end_users: any[];
  login_history: any[];
  active_sessions: any[];
  next_id: { license: number; user: number; reseller: number; session: number };
}

let cachedDB: GistDB | null = null;
let lastRead = 0;
const CACHE_TTL = 2000;

const defaultDB: GistDB = {
  apps: [{ id: 1, name: "Default App", secret: "1yfUR0CH18FdIN7galQapWCMY8GxZmCx" }],
  admins: [{ id: 1, username: "Zeniht", password_hash: "", role: "admin" }],
  resellers: [],
  licenses: [],
  end_users: [],
  login_history: [],
  active_sessions: [],
  next_id: { license: 1, user: 1, reseller: 1, session: 1 },
};

async function gistRead(): Promise<GistDB> {
  const now = Date.now();
  if (cachedDB && now - lastRead < CACHE_TTL) return cachedDB;

  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Gist read error:", res.status);
    return cachedDB || { ...defaultDB };
  }

  const gist = await res.json();
  const content = gist.files?.["db.json"]?.content;
  if (!content) return cachedDB || { ...defaultDB };

  try {
    cachedDB = JSON.parse(content);
    lastRead = now;
  } catch (e) {
    console.error("JSON parse error:", e);
  }
  return cachedDB || { ...defaultDB };
}

async function gistWrite(db: GistDB): Promise<void> {
  const content = JSON.stringify(db, null, 2);
  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ files: { "db.json": { content } } }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gist write error ${res.status}: ${text}`);
  }

  cachedDB = db;
  lastRead = Date.now();
}

export async function ensureDb() {
  const db = await gistRead();
  if (db.admins.length === 0) {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("Zeniht2025", 10);
    db.admins.push({ id: 1, username: "Zeniht", password_hash: hash, role: "admin" });
    db.apps.push({ id: 1, name: "Default App", secret: generateAppSecret(), admin_id: 1, created_at: new Date().toISOString() });
    await gistWrite(db);
  }
}

function getTable(db: GistDB, table: string): any[] {
  const t = db[table as keyof GistDB];
  return Array.isArray(t) ? t : [];
}

function nextIdVal(db: GistDB, table: string): number {
  const keyMap: Record<string, string> = {
    licenses: "license", end_users: "user", resellers: "reseller",
    active_sessions: "session", login_history: "session",
  };
  const key = keyMap[table] || "license";
  const id = (db.next_id as any)[key] || 1;
  (db.next_id as any)[key] = id + 1;
  return id;
}

function evalExpr(expr: string, row: any, args: any[]): any {
  expr = expr.trim();

  const maxMatch = expr.match(/MAX\((\d+),\s*(.+?)\)/i);
  if (maxMatch) {
    const base = parseInt(maxMatch[1]);
    const inner = evalExpr(maxMatch[2], row, args);
    return Math.max(base, inner);
  }

  const sumMatch = expr.match(/^(\w+)\s*\+\s*(.+)$/);
  if (sumMatch) {
    const current = Number(row[sumMatch[1]]) || 0;
    const val = evalExpr(sumMatch[2], row, args);
    return current + val;
  }

  const subMatch = expr.match(/^(\w+)\s*-\s*(.+)$/);
  if (subMatch) {
    const current = Number(row[subMatch[1]]) || 0;
    const val = evalExpr(subMatch[2], row, args);
    return current - val;
  }

  const argMatch = expr.match(/^\?$/);
  if (argMatch) {
    return args.shift();
  }

  const numMatch = expr.match(/^(\d+)$/);
  if (numMatch) return parseInt(numMatch[1]);

  const strMatch = expr.match(/^'(.*)'$/);
  if (strMatch) return strMatch[1];

  const colMatch = expr.match(/^(\w+)$/);
  if (colMatch && row[colMatch[1]] !== undefined) return row[colMatch[1]];

  return expr;
}

function cleanCol(col: string): string {
  return col.replace(/^\w+\./, "");
}

function matchRow(row: any, whereParts: string[], args: any[]): boolean {
  for (const part of whereParts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const neqMatch = trimmed.match(/(\w+(?:\.\w+)?)\s*!=\s*'([^']*)'/);
    if (neqMatch) {
      if (String(row[cleanCol(neqMatch[1])]) === neqMatch[2]) return false;
      continue;
    }

    const neqNumMatch = trimmed.match(/(\w+(?:\.\w+)?)\s*!=\s*(\d+)/);
    if (neqNumMatch && !neqMatch) {
      if (String(row[cleanCol(neqNumMatch[1])]) === neqNumMatch[2]) return false;
      continue;
    }

    const eqLitMatch = trimmed.match(/(\w+(?:\.\w+)?)\s*=\s*'([^']*)'/);
    if (eqLitMatch) {
      if (String(row[cleanCol(eqLitMatch[1])]) !== eqLitMatch[2]) return false;
      continue;
    }

    const eqNumMatch = trimmed.match(/(\w+(?:\.\w+)?)\s*=\s*(\d+)/);
    if (eqNumMatch && !eqLitMatch) {
      if (String(row[cleanCol(eqNumMatch[1])]) !== eqNumMatch[2]) return false;
      continue;
    }

    const likeMatch = trimmed.match(/(\w+(?:\.\w+)?)\s+LIKE\s+'([^']*)'/);
    if (likeMatch) {
      const pattern = likeMatch[2].replace(/%/g, ".*");
      if (!new RegExp(`^${pattern}$`, "i").test(String(row[cleanCol(likeMatch[1])]))) return false;
      continue;
    }

    const eqArgMatch = trimmed.match(/(\w+(?:\.\w+)?)\s*=\s*\?/);
    if (eqArgMatch) {
      const val = args.shift();
      if (val === undefined || val === null) continue;
      if (String(row[cleanCol(eqArgMatch[1])]) !== String(val)) return false;
      continue;
    }
  }
  return true;
}

function parseWhere(whereStr: string): string[] {
  if (!whereStr || !whereStr.trim()) return [];
  return whereStr.split(/\s+AND\s+/i);
}

export async function dbQuery(sql: string, args: any[] = []): Promise<{ rows: any[] }> {
  const db = await gistRead();

  const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM\s+(\w+)/i);
  if (selectMatch) {
    const cols = selectMatch[1].trim();
    const table = selectMatch[2];
    let rows = [...getTable(db, table)];
    const argsCopy = [...args];

    const afterFrom = sql.substring(selectMatch.index! + selectMatch[0].length);

    const whereMatch = afterFrom.match(/\s+WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT\s+|\s*$)/i);
    if (whereMatch) {
      const whereParts = parseWhere(whereMatch[1].trim());
      rows = rows.filter((r) => matchRow(r, whereParts, [...argsCopy]));
    }

    const orderByMatch = sql.match(/ORDER\s+BY\s+(\w+(?:\.\w+)?)\s+(ASC|DESC)/i);
    if (orderByMatch) {
      const col = cleanCol(orderByMatch[1]);
      const desc = orderByMatch[2].toUpperCase() === "DESC";
      rows.sort((a: any, b: any) => {
        const va = a[col] || "";
        const vb = b[col] || "";
        const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
        return desc ? -cmp : cmp;
      });
    }

    const limitMatch = sql.match(/LIMIT\s+(\d+|\?)/i);
    if (limitMatch) {
      if (limitMatch[1] === "?") {
        const limitVal = parseInt(argsCopy.pop()) || 100;
        rows = rows.slice(0, limitVal);
      } else {
        rows = rows.slice(0, parseInt(limitMatch[1]));
      }
    }

    if (cols === "*") return { rows };

    const countMatch = cols.match(/COUNT\(\*?\w*\)\s+as\s+(\w+)/i);
    if (countMatch) {
      return { rows: [{ [countMatch[1]]: rows.length }] };
    }

    const colList = cols.split(",").map((c) => c.trim().replace(/.*\./, "").replace(/\s+as\s+\w+/i, ""));
    return {
      rows: rows.map((r) => {
        const obj: any = {};
        colList.forEach((c) => { obj[c] = r[c]; });
        return obj;
      }),
    };
  }

  return { rows: [] };
}

export async function dbRun(sql: string, args: any[] = []): Promise<{ rows: any[]; lastInsertRowid: number }> {
  const db = await gistRead();
  let lastInsertRowid = 0;

  const insertMatch = sql.match(/INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
  if (insertMatch) {
    const [, table, colsStr] = insertMatch;
    const cols = colsStr.split(",").map((c) => c.trim());
    const row: any = {};
    cols.forEach((col, i) => {
      let val = args[i];
      if (val === undefined || val === "undefined") val = null;
      row[col] = val;
    });
    const arr = getTable(db, table);
    const id = nextIdVal(db, table);
    row.id = row.id || id;
    arr.push(row);
    lastInsertRowid = row.id;
    await gistWrite(db);
    return { rows: [], lastInsertRowid };
  }

  const updateMatch = sql.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+?))?$/i);
  if (updateMatch) {
    const [, table, setStr, whereStr] = updateMatch;
    const arr = getTable(db, table);
    let rowsToUpdate = [...arr];

    if (whereStr) {
      const whereParts = parseWhere(whereStr);
      rowsToUpdate = rowsToUpdate.filter((r) => matchRow(r, whereParts, [...args]));
    }

    const setParts = setStr.split(",").map((s) => s.trim());
    for (const part of setParts) {
      const eqMatch = part.match(/(\w+)\s*=\s*(.+)/);
      if (!eqMatch) continue;
      const [, col, valExpr] = eqMatch;

      for (const row of rowsToUpdate) {
        row[col] = evalExpr(valExpr, row, args);
      }
    }

    await gistWrite(db);
    return { rows: [], lastInsertRowid: 0 };
  }

  const deleteMatch = sql.match(/DELETE\s+FROM\s+(\w+)\s+WHERE\s+(.+?)$/i);
  if (deleteMatch) {
    const [, table, whereStr] = deleteMatch;
    const arr = getTable(db, table);
    const whereParts = parseWhere(whereStr);
    const toRemove = arr.filter((r) => matchRow(r, whereParts, [...args]));
    for (const r of toRemove) {
      const idx = arr.indexOf(r);
      if (idx >= 0) arr.splice(idx, 1);
    }
    await gistWrite(db);
    return { rows: [], lastInsertRowid: 0 };
  }

  return { rows: [], lastInsertRowid: 0 };
}

export function generateAppSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateLicenseKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const parts = [];
  for (let p = 0; p < 4; p++) {
    let part = "";
    for (let i = 0; i < 4; i++) {
      part += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    parts.push(part);
  }
  return parts.join("-");
}
