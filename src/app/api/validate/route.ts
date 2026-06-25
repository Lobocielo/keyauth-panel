import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, name, ownerid, secret, sessionid, username, password, hwid } = body;

    if (!name || !ownerid || !secret) {
      return NextResponse.json({ success: false, message: "Missing app credentials" }, { status: 400 });
    }

    const db = getDb();

    const appResult = await db.execute({
      sql: "SELECT a.*, ad.username as owner_name FROM apps a JOIN admins ad ON a.admin_id = ad.id WHERE a.name = ? AND a.id = ? AND a.secret = ?",
      args: [name, ownerid, secret],
    });

    if (appResult.rows.length === 0) {
      return NextResponse.json({ success: false, message: "Invalid app credentials" }, { status: 401 });
    }

    const app = appResult.rows[0] as any;

    if (type === "login") {
      if (!username || !password) {
        return NextResponse.json({ success: false, message: "Username and password required" });
      }

      const userResult = await db.execute({
        sql: "SELECT * FROM end_users WHERE app_id = ? AND username = ?",
        args: [app.id, username],
      });

      if (userResult.rows.length === 0) {
        return NextResponse.json({
          success: false,
          message: "User not found",
          sessionid: "",
        });
      }

      const user = userResult.rows[0] as any;
      const valid = await bcrypt.compare(password, user.password_hash);

      if (!valid) {
        return NextResponse.json({
          success: false,
          message: "Invalid password",
          sessionid: "",
        });
      }

      if (user.is_banned) {
        return NextResponse.json({
          success: false,
          message: "User is banned",
          sessionid: "",
        });
      }

      if (hwid && user.hwid && user.hwid !== hwid) {
        return NextResponse.json({
          success: false,
          message: "HWID mismatch",
          sessionid: "",
        });
      }

      const sessionId = crypto.randomUUID();

      if (hwid && !user.hwid) {
        await db.execute({
          sql: "UPDATE end_users SET hwid = ?, last_login = datetime('now') WHERE id = ?",
          args: [hwid, user.id],
        });
      } else {
        await db.execute({
          sql: "UPDATE end_users SET last_login = datetime('now') WHERE id = ?",
          args: [user.id],
        });
      }

      const licenseResult = await db.execute({
        sql: "SELECT * FROM licenses WHERE app_id = ? AND is_used = 0 ORDER BY created_at DESC LIMIT 1",
        args: [app.id],
      });

      let expiry = "";
      if (licenseResult.rows.length > 0) {
        const lic = licenseResult.rows[0] as any;
        await db.execute({
          sql: "UPDATE licenses SET is_used = 1, used_by = ? WHERE id = ?",
          args: [user.id, lic.id],
        });
        expiry = lic.expires_at || "";
      }

      await db.execute({
        sql: "INSERT INTO login_history (app_id, user_id, username, ip_address, success) VALUES (?, ?, ?, ?, 1)",
        args: [app.id, user.id, username, req.headers.get("x-forwarded-for") || ""],
      });

      return NextResponse.json({
        success: true,
        message: "Authorized",
        sessionid: expiry,
        info: username,
      });
    }

    if (type === "register") {
      if (!username || !password) {
        return NextResponse.json({ success: false, message: "Username and password required" });
      }

      const existing = await db.execute({
        sql: "SELECT id FROM end_users WHERE app_id = ? AND username = ?",
        args: [app.id, username],
      });

      if (existing.rows.length > 0) {
        return NextResponse.json({ success: false, message: "Username already taken" });
      }

      const hash = await bcrypt.hash(password, 10);
      await db.execute({
        sql: "INSERT INTO end_users (app_id, username, password_hash, hwid) VALUES (?, ?, ?, ?)",
        args: [app.id, username, hash, hwid || ""],
      });

      return NextResponse.json({
        success: true,
        message: "User registered",
        sessionid: "",
      });
    }

    if (type === "session") {
      if (!username || !sessionid) {
        return NextResponse.json({ success: false, message: "Missing session info" });
      }

      return NextResponse.json({
        success: true,
        message: "Session valid",
        info: username,
      });
    }

    return NextResponse.json({ success: false, message: "Invalid type" });
  } catch (error) {
    console.error("Validate error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
