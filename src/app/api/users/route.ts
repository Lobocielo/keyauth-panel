import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
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
      return NextResponse.json({ users: [] });
    }

    const appId = (appResult.rows[0] as any).id;
    const result = await dbQuery(
      "SELECT id, app_id, username, hwid, is_banned, last_login, created_at FROM end_users WHERE app_id = ? ORDER BY created_at DESC",
      [appId]
    );
    return NextResponse.json({ users: result.rows });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { userId } = await req.json();
    await ensureDb();

    const appResult = await dbQuery("SELECT id FROM apps WHERE admin_id = ?", [session.userId]);
    if (appResult.rows.length === 0) {
      return NextResponse.json({ error: "No app found" }, { status: 404 });
    }

    const appId = (appResult.rows[0] as any).id;
    await dbRun("DELETE FROM end_users WHERE id = ? AND app_id = ?", [userId, appId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { userId, is_banned } = await req.json();
    await ensureDb();

    const appResult = await dbQuery("SELECT id FROM apps WHERE admin_id = ?", [session.userId]);
    if (appResult.rows.length === 0) {
      return NextResponse.json({ error: "No app found" }, { status: 404 });
    }

    const appId = (appResult.rows[0] as any).id;
    await dbRun("UPDATE end_users SET is_banned = ? WHERE id = ? AND app_id = ?", [is_banned ? 1 : 0, userId, appId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
