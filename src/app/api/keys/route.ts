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

    if (session.userType === "reseller") {
      const result = await dbQuery(
        "SELECT * FROM licenses WHERE created_by_type = 'reseller' AND created_by_id = ? ORDER BY created_at DESC",
        [session.userId]
      );
      return NextResponse.json({ keys: result.rows });
    }

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

    const body = await req.json();
    const { key, subscription_days, type, notes, package_name, quantity } = body;
    await ensureDb();

    const typeStr = String(type || 1);
    const qty = Math.min(Math.max(parseInt(quantity) || 1, 1), 100);
    const days = parseInt(subscription_days) || 30;

    if (session.userType === "reseller") {
      const rResult = await dbQuery("SELECT key_limit, keys_used, credits, credit_cost, is_active FROM resellers WHERE id = ?", [session.userId]);
      if (rResult.rows.length === 0) {
        return NextResponse.json({ error: "Reseller not found" }, { status: 404 });
      }
      const reseller = rResult.rows[0] as any;
      if (!reseller.is_active) {
        return NextResponse.json({ error: "Tu cuenta de revendedor esta desactivada" }, { status: 403 });
      }
      if (reseller.keys_used + qty > reseller.key_limit) {
        return NextResponse.json({ error: `Has alcanzado tu limite de keys. Quedan ${reseller.key_limit - reseller.keys_used}` }, { status: 403 });
      }
      const cost = (reseller.credit_cost || 1.0) * qty;
      if (reseller.credits < cost) {
        return NextResponse.json({ error: `No tienes suficientes creditos. Necesitas ${cost}, tienes ${reseller.credits}` }, { status: 403 });
      }

      const appResult = await dbQuery("SELECT id FROM apps LIMIT 1", []);
      if (appResult.rows.length === 0) {
        return NextResponse.json({ error: "No app found" }, { status: 404 });
      }
      const appId = (appResult.rows[0] as any).id;

      const keys: string[] = [];
      for (let i = 0; i < qty; i++) {
        const keyValue = (i === 0 && key) ? key : generateLicenseKey();
        let expiresAt = null;
        if (typeStr !== "3" && days) {
          const d = new Date();
          d.setDate(d.getDate() + days);
          expiresAt = d.toISOString();
        }

        await dbRun(
          "INSERT INTO licenses (app_id, license_key, package_name, duration_days, type, expires_at, created_by_type, created_by_id) VALUES (?, ?, ?, ?, ?, ?, 'reseller', ?)",
          [appId, keyValue, package_name || "", days, typeStr, expiresAt, session.userId]
        );
        keys.push(keyValue);
      }
      await dbRun("UPDATE resellers SET keys_used = keys_used + ?, credits = credits - ? WHERE id = ?", [qty, cost, session.userId]);

      return NextResponse.json({ success: true, keys });
    }

    const appResult = await dbQuery("SELECT id FROM apps WHERE admin_id = ?", [session.userId]);
    if (appResult.rows.length === 0) {
      return NextResponse.json({ error: "No app found" }, { status: 404 });
    }

    const appId = (appResult.rows[0] as any).id;

    const keys: string[] = [];
    for (let i = 0; i < qty; i++) {
      const keyValue = (i === 0 && key) ? key : generateLicenseKey();
      let expiresAt = null;
      if (typeStr !== "3" && days) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        expiresAt = d.toISOString();
      }

      await dbRun(
        "INSERT INTO licenses (app_id, license_key, package_name, duration_days, type, expires_at, created_by_type, created_by_id) VALUES (?, ?, ?, ?, ?, ?, 'admin', ?)",
        [appId, keyValue, package_name || "", days, typeStr, expiresAt, session.userId]
      );
      keys.push(keyValue);
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

    const { key_id } = await req.json();
    await ensureDb();

    if (session.userType === "reseller") {
      await dbRun("DELETE FROM licenses WHERE id = ? AND created_by_type = 'reseller' AND created_by_id = ?", [key_id, session.userId]);
      await dbRun("UPDATE resellers SET keys_used = MAX(0, keys_used - 1) WHERE id = ?", [session.userId]);
      return NextResponse.json({ success: true });
    }

    const appResult = await dbQuery("SELECT id FROM apps WHERE admin_id = ?", [session.userId]);
    if (appResult.rows.length === 0) {
      return NextResponse.json({ error: "No app found" }, { status: 404 });
    }

    const appId = (appResult.rows[0] as any).id;
    await dbRun("DELETE FROM licenses WHERE id = ? AND app_id = ?", [key_id, appId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete key error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
