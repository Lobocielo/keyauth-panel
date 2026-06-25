import { NextRequest, NextResponse } from "next/server";
import { getSession, generateLicenseKey } from "@/lib/auth";
import { ensureDb, dbQuery, dbRun } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await ensureDb();
    const appResult = await dbQuery("SELECT id FROM apps WHERE admin_id = ?", [session.userId]);

    if (appResult.rows.length === 0) {
      return NextResponse.json({ keys: [] });
    }

    const appId = (appResult.rows[0] as any).id;
    const result = await dbQuery("SELECT * FROM licenses WHERE app_id = ? ORDER BY created_at DESC", [appId]);
    return NextResponse.json({ keys: result.rows });
  } catch (error) {
    console.error("Get keys error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { type, duration_days, quantity } = await req.json();
    await ensureDb();

    const appResult = await dbQuery("SELECT id FROM apps WHERE admin_id = ?", [session.userId]);
    if (appResult.rows.length === 0) {
      return NextResponse.json({ error: "No app found" }, { status: 404 });
    }

    const appId = (appResult.rows[0] as any).id;
    const keys: string[] = [];
    const count = Math.min(Math.max(quantity || 1, 1), 100);

    for (let i = 0; i < count; i++) {
      const key = generateLicenseKey();
      let expiresAt = null;
      if (type === "subscription" && duration_days) {
        const d = new Date();
        d.setDate(d.getDate() + duration_days);
        expiresAt = d.toISOString();
      }
      await dbRun(
        "INSERT INTO licenses (app_id, license_key, type, duration_days, expires_at) VALUES (?, ?, ?, ?, ?)",
        [appId, key, type || "subscription", duration_days || 30, expiresAt]
      );
      keys.push(key);
    }

    return NextResponse.json({ success: true, keys });
  } catch (error) {
    console.error("Create key error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { keyId } = await req.json();
    await ensureDb();

    const appResult = await dbQuery("SELECT id FROM apps WHERE admin_id = ?", [session.userId]);
    if (appResult.rows.length === 0) {
      return NextResponse.json({ error: "No app found" }, { status: 404 });
    }

    const appId = (appResult.rows[0] as any).id;
    await dbRun("DELETE FROM licenses WHERE id = ? AND app_id = ?", [keyId, appId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete key error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
