import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { createToken } from "@/lib/auth";
import { generateAppSecret } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }

    if (username.length < 3 || password.length < 4) {
      return NextResponse.json({ error: "Username min 3 chars, password min 4 chars" }, { status: 400 });
    }

    const db = getDb();

    const existing = await db.execute({
      sql: "SELECT id FROM admins WHERE username = ?",
      args: [username],
    });

    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await db.execute({
      sql: "INSERT INTO admins (username, password_hash) VALUES (?, ?)",
      args: [username, hash],
    });

    const adminId = Number(result.lastInsertRowid);

    const secret = generateAppSecret();
    await db.execute({
      sql: "INSERT INTO apps (admin_id, name, secret) VALUES (?, ?, ?)",
      args: [adminId, `${username}'s App`, secret],
    });

    const token = await createToken({
      userId: adminId,
      username,
      userType: "admin",
    });

    const response = NextResponse.json({
      success: true,
      user: { id: Number(adminId), username },
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
    console.error("Register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
