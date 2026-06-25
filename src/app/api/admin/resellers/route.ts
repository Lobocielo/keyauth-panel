import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { ensureDb, dbQuery, dbRun } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.userType !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    await ensureDb();
    const result = await dbQuery("SELECT id, username, key_limit, keys_used, is_active, created_at FROM resellers WHERE admin_id = ? ORDER BY created_at DESC", [session.userId]);
    return NextResponse.json({ resellers: result.rows });
  } catch (error) {
    console.error("Get resellers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.userType !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    const { username, password, key_limit } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }

    await ensureDb();
    const existing = await dbQuery("SELECT id FROM resellers WHERE username = ?", [username]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    await dbRun(
      "INSERT INTO resellers (admin_id, username, password_hash, key_limit) VALUES (?, ?, ?, ?)",
      [session.userId, username, hash, key_limit || 50]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Create reseller error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.userType !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    const { reseller_id, key_limit, is_active } = await req.json();
    await ensureDb();

    if (key_limit !== undefined) {
      await dbRun("UPDATE resellers SET key_limit = ? WHERE id = ? AND admin_id = ?", [key_limit, reseller_id, session.userId]);
    }
    if (is_active !== undefined) {
      await dbRun("UPDATE resellers SET is_active = ? WHERE id = ? AND admin_id = ?", [is_active ? 1 : 0, reseller_id, session.userId]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update reseller error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.userType !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    const { reseller_id } = await req.json();
    await ensureDb();
    await dbRun("DELETE FROM resellers WHERE id = ? AND admin_id = ?", [reseller_id, session.userId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete reseller error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
