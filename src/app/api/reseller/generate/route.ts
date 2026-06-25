import { NextRequest, NextResponse } from "next/server";
import { getSession, generateLicenseKey } from "@/lib/auth";
import { ensureDb, dbQuery, dbRun } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.userType !== "reseller") {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    const { type, duration_days, quantity } = await req.json();
    await ensureDb();

    const reseller = await dbQuery("SELECT * FROM resellers WHERE id = ?", [session.userId]);
    if (reseller.rows.length === 0) {
      return NextResponse.json({ error: "Reseller not found" }, { status: 404 });
    }

    const r = reseller.rows[0] as any;
    const count = Math.min(Math.max(quantity || 1, 1), 100);
    const remaining = r.key_limit - r.keys_used;

    if (remaining <= 0) {
      return NextResponse.json({ error: "Key limit reached. Contact admin." }, { status: 403 });
    }

    const actualCount = Math.min(count, remaining);

    const appResult = await dbQuery("SELECT id FROM apps WHERE admin_id = ?", [r.admin_id]);
    if (appResult.rows.length === 0) {
      return NextResponse.json({ error: "No app found" }, { status: 404 });
    }

    const appId = (appResult.rows[0] as any).id;
    const keys: string[] = [];

    for (let i = 0; i < actualCount; i++) {
      const key = generateLicenseKey();
      let expiresAt = null;
      if (type === "subscription" && duration_days) {
        const d = new Date();
        d.setDate(d.getDate() + duration_days);
        expiresAt = d.toISOString();
      }
      await dbRun(
        "INSERT INTO licenses (app_id, created_by_type, created_by_id, license_key, type, duration_days, expires_at) VALUES (?, 'reseller', ?, ?, ?, ?, ?)",
        [appId, session.userId, key, type || "subscription", duration_days || 30, expiresAt]
      );
      keys.push(key);
    }

    await dbRun("UPDATE resellers SET keys_used = keys_used + ? WHERE id = ?", [actualCount, session.userId]);

    return NextResponse.json({ success: true, keys, remaining: remaining - actualCount });
  } catch (error) {
    console.error("Reseller generate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
