import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { ensureDb, dbQuery, dbRun } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.userType !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }

    await ensureDb();

    const appResult = await dbQuery("SELECT id FROM apps WHERE admin_id = ?", [session.userId]);
    if (appResult.rows.length === 0) {
      return NextResponse.json({ error: "No app found" }, { status: 404 });
    }
    const appId = (appResult.rows[0] as any).id;

    const existing = await dbQuery("SELECT id FROM end_users WHERE app_id = ? AND username = ?", [appId, username]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    await dbRun("INSERT INTO end_users (app_id, username, password_hash) VALUES (?, ?, ?)", [appId, username, hash]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
