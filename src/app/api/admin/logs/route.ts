import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureDb, dbQuery } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.userType !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    await ensureDb();

    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 500);
    const type = url.searchParams.get("type") || "all";

    let query = "";
    let params: any[] = [];

    if (type === "admin") {
      query = "SELECT * FROM login_history WHERE success = 1 ORDER BY created_at DESC LIMIT ?";
      params = [limit];
    } else if (type === "failed") {
      query = "SELECT * FROM login_history WHERE success = 0 ORDER BY created_at DESC LIMIT ?";
      params = [limit];
    } else {
      query = "SELECT * FROM login_history ORDER BY created_at DESC LIMIT ?";
      params = [limit];
    }

    const result = await dbQuery(query, params);

    // Also get admin panel logins (from admins table activity)
    const adminLogins = await dbQuery(
      "SELECT lh.* FROM login_history lh INNER JOIN end_users eu ON lh.user_id = eu.id ORDER BY lh.created_at DESC LIMIT ?",
      [limit]
    );

    return NextResponse.json({ logs: result.rows });
  } catch (error) {
    console.error("Get logs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
