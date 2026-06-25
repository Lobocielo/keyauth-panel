import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureDb, dbQuery, dbRun } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.userType !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    await ensureDb();

    const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    await dbRun(
      "DELETE FROM active_sessions WHERE last_heartbeat < ?",
      [cutoff]
    );

    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "active";

    if (type === "active") {
      const result = await dbQuery(
        "SELECT * FROM active_sessions ORDER BY last_heartbeat DESC",
        []
      );
      return NextResponse.json({ sessions: result.rows });
    }

    if (type === "history") {
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 500);
      const result = await dbQuery(
        "SELECT * FROM login_history ORDER BY created_at DESC LIMIT ?",
        [limit]
      );
      return NextResponse.json({ logs: result.rows });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Monitor error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.userType !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    const { username } = await req.json();
    await ensureDb();

    if (username) {
      await dbRun("DELETE FROM active_sessions WHERE username = ?", [username]);
      return NextResponse.json({ success: true, message: `Kicked ${username}` });
    }

    return NextResponse.json({ error: "Username required" }, { status: 400 });
  } catch (error) {
    console.error("Kick error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
