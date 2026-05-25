import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const SESSION_COOKIE = "am_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export type SessionPayload = JWTPayload & {
  sub: string;
  expiresAt: number;
};

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(new Date(payload.expiresAt))
    .sign(getSecret());
}

export async function decrypt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(username: string) {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const token = await encrypt({ sub: username, expiresAt });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(expiresAt),
    path: "/",
  });
}

export async function deleteSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function readSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return decrypt(token);
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
