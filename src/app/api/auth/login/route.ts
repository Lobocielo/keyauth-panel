import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ensureDb, dbQuery, dbRun } from "@/lib/db";
import { createToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password, appId } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }

    await ensureDb();
    const result = await dbQuery("SELECT * FROM admins WHERE username = ?", [username]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const admin = result.rows[0] as any;
    const valid = await bcrypt.compare(password, admin.password_hash);

    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await createToken({
      userId: admin.id,
      username: admin.username,
      userType: "admin",
    });

    // Log the login
    const appResult = await dbQuery("SELECT id FROM apps LIMIT 1", []);
    const logAppId = appResult.rows.length > 0 ? (appResult.rows[0] as any).id : 1;
    await dbRun(
      "INSERT INTO login_history (app_id, user_id, username, ip_address, success) VALUES (?, ?, ?, ?, 1)",
      [logAppId, admin.id, admin.username, req.headers.get("x-forwarded-for") || "unknown"]
    );

    const response = NextResponse.json({
      success: true,
      user: { id: admin.id, username: admin.username },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
