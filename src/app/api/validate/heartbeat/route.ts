import { NextRequest, NextResponse } from "next/server";
import { ensureDb, dbQuery, dbRun } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name, ownerid, secret, sessionid,
      username, hwid, ip_address,
      pc_name, os_info, cpu_info, ram_info,
      gpu_info, screen_res, mac_address,
      is_rdp, is_vm, is_sandbox,
      country, city
    } = body;

    if (!name || !ownerid || !secret || !username) {
      return NextResponse.json({ success: false, message: "Missing parameters" });
    }

    await ensureDb();

    const appResult = await dbQuery(
      "SELECT a.id FROM apps a WHERE a.name = ? AND a.id = ? AND a.secret = ?",
      [name, ownerid, secret]
    );

    if (appResult.rows.length === 0) {
      return NextResponse.json({ success: false, message: "Invalid app" });
    }

    const appId = (appResult.rows[0] as any).id;
    const ip = ip_address || req.headers.get("x-forwarded-for") || "unknown";
    const now = new Date().toISOString();

    // Update or insert active session
    const existing = await dbQuery(
      "SELECT id FROM active_sessions WHERE app_id = ? AND username = ? AND hwid = ?",
      [appId, username, hwid || ""]
    );

    if (existing.rows.length > 0) {
      await dbRun(
        `UPDATE active_sessions SET
          ip_address = ?, pc_name = ?, os_info = ?, cpu_info = ?,
          ram_info = ?, gpu_info = ?, screen_res = ?, mac_address = ?,
          is_rdp = ?, is_vm = ?, is_sandbox = ?, country = ?, city = ?,
          last_heartbeat = ?
        WHERE app_id = ? AND username = ? AND hwid = ?`,
        [ip, pc_name || "", os_info || "", cpu_info || "", ram_info || "",
         gpu_info || "", screen_res || "", mac_address || "",
         is_rdp ? 1 : 0, is_vm ? 1 : 0, is_sandbox ? 1 : 0,
         country || "", city || "", now,
         appId, username, hwid || ""]
      );
    } else {
      await dbRun(
        `INSERT INTO active_sessions
          (app_id, user_id, username, ip_address, hwid, pc_name, os_info,
           cpu_info, ram_info, gpu_info, screen_res, mac_address,
           is_rdp, is_vm, is_sandbox, country, city, last_heartbeat, created_at)
        VALUES (?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [appId, username, ip, hwid || "", pc_name || "", os_info || "",
         cpu_info || "", ram_info || "", gpu_info || "", screen_res || "",
         mac_address || "", is_rdp ? 1 : 0, is_vm ? 1 : 0, is_sandbox ? 1 : 0,
         country || "", city || "", now, now]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Heartbeat error:", error);
    return NextResponse.json({ success: false, message: "Server error" });
  }
}
