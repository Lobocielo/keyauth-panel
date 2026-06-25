import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb, ensureDb } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await ensureDb();
    const db = getDb();
    const appResult = await db.execute({
      sql: "SELECT id, name, secret FROM apps WHERE admin_id = ?",
      args: [session.userId],
    });

    if (appResult.rows.length === 0) {
      return NextResponse.json({
        stats: { totalKeys: 0, usedKeys: 0, activeUsers: 0, bannedUsers: 0 },
        app: null,
      });
    }

    const app = appResult.rows[0] as any;
    const appId = app.id;

    const [totalKeys, usedKeys, activeUsers, bannedUsers, recentLogins] = await Promise.all([
      db.execute({ sql: "SELECT COUNT(*) as count FROM licenses WHERE app_id = ?", args: [appId] }),
      db.execute({ sql: "SELECT COUNT(*) as count FROM licenses WHERE app_id = ? AND is_used = 1", args: [appId] }),
      db.execute({ sql: "SELECT COUNT(*) as count FROM end_users WHERE app_id = ? AND is_banned = 0", args: [appId] }),
      db.execute({ sql: "SELECT COUNT(*) as count FROM end_users WHERE app_id = ? AND is_banned = 1", args: [appId] }),
      db.execute({ sql: "SELECT * FROM login_history WHERE app_id = ? ORDER BY created_at DESC LIMIT 10", args: [appId] }),
    ]);

    return NextResponse.json({
      stats: {
        totalKeys: (totalKeys.rows[0] as any).count,
        usedKeys: (usedKeys.rows[0] as any).count,
        activeUsers: (activeUsers.rows[0] as any).count,
        bannedUsers: (bannedUsers.rows[0] as any).count,
      },
      app: { id: app.id, name: app.name, secret: app.secret },
      recentLogins: recentLogins.rows,
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
