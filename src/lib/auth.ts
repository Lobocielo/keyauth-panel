import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "kpl-change-this-to-random-string-9x8k2m"
);

export interface SessionPayload extends JWTPayload {
  userId: number;
  username: string;
  userType: "admin" | "reseller";
  appId?: number;
}

export async function createToken(payload: Omit<SessionPayload, "iat" | "exp" | "iss">): Promise<string> {
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("licensepanel")
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { issuer: "licensepanel" });
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function generateLicenseKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const parts: string[] = [];
  for (let i = 0; i < 4; i++) {
    let seg = "";
    for (let j = 0; j < 5; j++) {
      seg += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    parts.push(seg);
  }
  return parts.join("-");
}

export function generateAppSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
