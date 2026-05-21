import { NextResponse } from "next/server";

export async function GET() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  return NextResponse.json({
    TURSO_DATABASE_URL: tursoUrl ? `SET (${tursoUrl.slice(0, 30)}...)` : "NOT SET",
    TURSO_AUTH_TOKEN: tursoToken ? `SET (length: ${tursoToken.length})` : "NOT SET",
    DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT SET",
  });
}
