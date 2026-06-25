import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { key, hwid } = await req.json();

    if (!key) {
      return NextResponse.json({ success: false, message: "Key required" });
    }

    const db = getDb();

    const keyResult = await db.execute({
      sql: "SELECT l.*, a.id as app_id FROM licenses l JOIN apps a ON l.app_id = a.id WHERE l.license_key = ?",
      args: [key],
    });

    if (keyResult.rows.length === 0) {
      return NextResponse.json({ success: false, message: "Invalid key" });
    }

    const license = keyResult.rows[0] as any;

    if (license.expires_at) {
      const expiry = new Date(license.expires_at);
      if (expiry < new Date()) {
        return NextResponse.json({ success: false, message: "Key expired" });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Key valid",
      type: license.type,
      expires: license.expires_at || "never",
    });
  } catch (error) {
    console.error("License validate error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
