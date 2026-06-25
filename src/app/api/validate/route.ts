import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ensureDb, dbQuery, dbRun } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, name, ownerid, secret, sessionid, username, password, hwid, key } = body;

    if (!name || !ownerid || !secret) {
      return NextResponse.json({ success: false, message: "Missing app credentials" }, { status: 400 });
    }

    await ensureDb();

    const appResult = await dbQuery(
      "SELECT a.id, a.name, a.secret, a.admin_id FROM apps a WHERE a.name = ? AND a.id = ? AND a.secret = ?",
      [name, ownerid, secret]
    );

    if (appResult.rows.length === 0) {
      return NextResponse.json({ success: false, message: "Invalid app credentials" }, { status: 401 });
    }

    const app = appResult.rows[0] as any;

    if (type === "login") {
      if (!username || !password) {
        return NextResponse.json({ success: false, message: "Username and password required" });
      }

      const userResult = await dbQuery(
        "SELECT * FROM end_users WHERE app_id = ? AND username = ?",
        [app.id, username]
      );

      if (userResult.rows.length === 0) {
        return NextResponse.json({ success: false, message: "User not found", sessionid: "" });
      }

      const user = userResult.rows[0] as any;
      const valid = await bcrypt.compare(password, user.password_hash);

      if (!valid) {
        return NextResponse.json({ success: false, message: "Invalid password", sessionid: "" });
      }

      if (user.is_banned) {
        return NextResponse.json({ success: false, message: "User is banned", sessionid: "" });
      }

      // HWID check
      if (hwid && user.hwid && user.hwid !== hwid) {
        return NextResponse.json({ success: false, message: "HWID mismatch", sessionid: "" });
      }

      // Update HWID
      const now = new Date().toISOString();
      if (hwid && !user.hwid) {
        await dbRun("UPDATE end_users SET hwid = ?, last_login = ? WHERE id = ?", [hwid, now, user.id]);
      } else {
        await dbRun("UPDATE end_users SET last_login = ? WHERE id = ?", [now, user.id]);
      }

      // Check if user has an active license
      const userLicense = await dbQuery(
        "SELECT * FROM licenses WHERE app_id = ? AND used_by = ? AND is_used = 1 ORDER BY created_at DESC LIMIT 1",
        [app.id, user.id]
      );

      let expiry = "";
      if (userLicense.rows.length > 0) {
        const lic = userLicense.rows[0] as any;
        // Check if license is expired
        if (lic.expires_at && lic.type !== "3") {
          const expDate = new Date(lic.expires_at);
          if (expDate < new Date()) {
            return NextResponse.json({ success: false, message: "License expired", sessionid: "" });
          }
        }
        expiry = lic.expires_at || "lifetime";
      } else {
        // No license assigned yet - try to assign one
        const availableLicense = await dbQuery(
          "SELECT * FROM licenses WHERE app_id = ? AND is_used = 0 ORDER BY created_at DESC LIMIT 1",
          [app.id]
        );

        if (availableLicense.rows.length > 0) {
          const lic = availableLicense.rows[0] as any;
          await dbRun("UPDATE licenses SET is_used = 1, used_by = ? WHERE id = ?", [user.id, lic.id]);
          expiry = lic.expires_at || "lifetime";
        } else {
          return NextResponse.json({ success: false, message: "No license available. Contact admin.", sessionid: "" });
        }
      }

      await dbRun(
        "INSERT INTO login_history (app_id, user_id, username, ip_address, success) VALUES (?, ?, ?, ?, 1)",
        [app.id, user.id, username, req.headers.get("x-forwarded-for") || ""]
      );

      return NextResponse.json({ success: true, message: "Authorized", sessionid: expiry, info: username });
    }

    if (type === "register") {
      if (!username || !password) {
        return NextResponse.json({ success: false, message: "Username and password required" });
      }

      const existing = await dbQuery(
        "SELECT id FROM end_users WHERE app_id = ? AND username = ?",
        [app.id, username]
      );

      if (existing.rows.length > 0) {
        return NextResponse.json({ success: false, message: "Username already taken" });
      }

      // If key is provided, validate it first
      if (key) {
        const keyResult = await dbQuery(
          "SELECT * FROM licenses WHERE app_id = ? AND license_key = ? AND is_used = 0",
          [app.id, key]
        );

        if (keyResult.rows.length === 0) {
          return NextResponse.json({ success: false, message: "Invalid or already used key" });
        }
      }

      const hash = await bcrypt.hash(password, 10);
      const userResult = await dbRun(
        "INSERT INTO end_users (app_id, username, password_hash, hwid) VALUES (?, ?, ?, ?)",
        [app.id, username, hash, hwid || ""]
      );

      // If key was provided, assign it to this new user
      if (key) {
        const userId = userResult.lastInsertRowid;
        await dbRun(
          "UPDATE licenses SET is_used = 1, used_by = ? WHERE app_id = ? AND license_key = ? AND is_used = 0",
          [userId, app.id, key]
        );
      }

      return NextResponse.json({ success: true, message: "User registered", sessionid: "" });
    }

    if (type === "session") {
      if (!username || !sessionid) {
        return NextResponse.json({ success: false, message: "Missing session info" });
      }
      return NextResponse.json({ success: true, message: "Session valid", info: username });
    }

    return NextResponse.json({ success: false, message: "Invalid type" });
  } catch (error) {
    console.error("Validate error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
