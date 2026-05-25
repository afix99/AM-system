import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    AUTH_SECRET_set: Boolean(process.env.AUTH_SECRET),
    AUTH_SECRET_length: process.env.AUTH_SECRET?.length ?? 0,
    AUTH_USERNAME_set: Boolean(process.env.AUTH_USERNAME),
    AUTH_USERNAME_value_lowercased: process.env.AUTH_USERNAME?.trim().toLowerCase() ?? null,
    AUTH_USERNAME_length: process.env.AUTH_USERNAME?.length ?? 0,
    AUTH_PASSWORD_set: Boolean(process.env.AUTH_PASSWORD),
    AUTH_PASSWORD_length: process.env.AUTH_PASSWORD?.length ?? 0,
    AUTH_PASSWORD_first_char: process.env.AUTH_PASSWORD?.charAt(0) ?? null,
    AUTH_PASSWORD_last_char: process.env.AUTH_PASSWORD?.charAt((process.env.AUTH_PASSWORD?.length ?? 1) - 1) ?? null,
    AUTH_PASSWORD_HASH_still_set: Boolean(process.env.AUTH_PASSWORD_HASH),
    node_env: process.env.NODE_ENV,
  });
}
