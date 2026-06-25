import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ensureDb, dbQuery } from "@/lib/db";
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
      await dbQuery(
        "INSERT INTO login_history (app_id, user_id, username, ip_address, success) VALUES (0, 0, ?, ?, 0)",
        [username, ip]
      );
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const reseller = result.rows[0] as any;
    const valid = await bcrypt.compare(password, reseller.password_hash);
    if (!valid) {
      await dbQuery(
        "INSERT INTO login_history (app_id, user_id, username, ip_address, success) VALUES (0, ?, ?, ?, 0)",
        [reseller.id, username, ip]
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
    await dbQuery(
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
