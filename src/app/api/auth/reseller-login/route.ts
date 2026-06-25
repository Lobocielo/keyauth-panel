import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ensureDb, dbQuery, dbRun } from "@/lib/db";
import { createToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }

    await ensureDb();
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const result = await dbQuery("SELECT * FROM resellers WHERE username = ? AND is_active = 1", [username]);
    if (result.rows.length === 0) {
      // Log failed attempt
      const appResult2 = await dbQuery("SELECT id FROM apps LIMIT 1", []);
      const logAppId = appResult2.rows.length > 0 ? (appResult2.rows[0] as any).id : 1;
      await dbRun(
        "INSERT INTO login_history (app_id, user_id, username, ip_address, success) VALUES (?, 0, ?, ?, 0)",
        [logAppId, username, ip]
      );
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const reseller = result.rows[0] as any;
    const valid = await bcrypt.compare(password, reseller.password_hash);
    if (!valid) {
      const appResult3 = await dbQuery("SELECT id FROM apps LIMIT 1", []);
      const logAppId2 = appResult3.rows.length > 0 ? (appResult3.rows[0] as any).id : 1;
      await dbRun(
        "INSERT INTO login_history (app_id, user_id, username, ip_address, success) VALUES (?, ?, ?, ?, 0)",
        [logAppId2, reseller.id, username, ip]
      );
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const appResult = await dbQuery("SELECT id FROM apps WHERE admin_id = ?", [reseller.admin_id]);
    const appId = appResult.rows.length > 0 ? (appResult.rows[0] as any).id : 1;

    const token = await createToken({
      userId: reseller.id,
      username: reseller.username,
      userType: "reseller",
      appId,
    });

    // Log successful login
    await dbRun(
      "INSERT INTO login_history (app_id, user_id, username, ip_address, success) VALUES (?, ?, ?, ?, 1)",
      [appId, reseller.id, reseller.username, ip]
    );

    const response = NextResponse.json({
      success: true,
      user: { id: reseller.id, username: reseller.username, keys_used: reseller.keys_used, key_limit: reseller.key_limit },
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
    console.error("Reseller login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
