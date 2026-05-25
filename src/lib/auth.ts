import "server-only";
import { NextResponse } from "next/server";
import { readSession } from "./session";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  const expectedUser = process.env.AUTH_USERNAME;
  const expectedPassword = process.env.AUTH_PASSWORD;
  if (!expectedUser || !expectedPassword) return false;
  const userMatch = timingSafeEqual(
    username.trim().toLowerCase(),
    expectedUser.trim().toLowerCase()
  );
  const passMatch = timingSafeEqual(password, expectedPassword);
  return userMatch && passMatch;
}

export async function requireApiAuth(): Promise<NextResponse | null> {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
