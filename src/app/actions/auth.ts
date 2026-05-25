"use server";
import { redirect } from "next/navigation";
import { verifyCredentials } from "@/lib/auth";
import { createSession, deleteSession } from "@/lib/session";

export type LoginState = { error?: string } | undefined;

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");
  if (!username || !password) {
    return { error: "Username and password are required" };
  }
  const ok = await verifyCredentials(username, password);
  if (!ok) {
    return { error: "Invalid username or password" };
  }
  await createSession(username);
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
