import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureDb, dbQuery } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await ensureDb();
    const appResult = await dbQuery("SELECT id, name, secret FROM apps WHERE admin_id = ?", [session.userId]);

    if (appResult.rows.length === 0) {
      return NextResponse.json({
        stats: { totalKeys: 0, usedKeys: 0, activeUsers: 0, bannedUsers: 0 },
        app: null,
      });
    }

    const app = appResult.rows[0] as any;
    const appId = app.id;

    const [totalKeys, usedKeys, activeUsers, bannedUsers] = await Promise.all([
      dbQuery("SELECT COUNT(*) as count FROM licenses WHERE app_id = ?", [appId]),
      dbQuery("SELECT COUNT(*) as count FROM licenses WHERE app_id = ? AND is_used = 1", [appId]),
      dbQuery("SELECT COUNT(*) as count FROM end_users WHERE app_id = ? AND is_banned = 0", [appId]),
      dbQuery("SELECT COUNT(*) as count FROM end_users WHERE app_id = ? AND is_banned = 1", [appId]),
    ]);

    return NextResponse.json({
      stats: {
        totalKeys: Number(totalKeys.rows[0]?.count || 0),
        usedKeys: Number(usedKeys.rows[0]?.count || 0),
        activeUsers: Number(activeUsers.rows[0]?.count || 0),
        bannedUsers: Number(bannedUsers.rows[0]?.count || 0),
      },
      app: { id: app.id, name: app.name, secret: app.secret },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
