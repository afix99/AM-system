import { put, del } from "@vercel/blob";

export async function uploadBlob(file: File, prefix = "uploads"): Promise<string> {
  const ext = file.name.split(".").pop() ?? "bin";
  const safeName = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const blob = await put(safeName, file, { access: "public" });
  return blob.url;
}

export async function deleteBlob(url: string): Promise<void> {
  try {
    await del(url);
  } catch {
    // Ignore — blob may already be gone, or token missing in dev
  }
}
