import "server-only";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { readSession } from "./session";

export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  const expectedUser = process.env.AUTH_USERNAME;
  const expectedHash = process.env.AUTH_PASSWORD_HASH;
  if (!expectedUser || !expectedHash) return false;
  if (username.trim().toLowerCase() !== expectedUser.trim().toLowerCase()) return false;
  return bcrypt.compare(password, expectedHash);
}

export async function requireApiAuth(): Promise<NextResponse | null> {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
