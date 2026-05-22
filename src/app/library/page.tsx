import { prisma } from "@/lib/prisma";
import { LibraryClient } from "@/components/library/LibraryClient";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  let entries: Awaited<ReturnType<typeof prisma.libraryEntry.findMany>> = [];
  try {
    entries = await prisma.libraryEntry.findMany({
      orderBy: [{ category: "asc" }, { title: "asc" }],
    });
  } catch (error) {
    console.error("[library] LibraryEntry table missing — visit /api/setup to provision", error);
  }
  return <LibraryClient initialEntries={JSON.parse(JSON.stringify(entries))} />;
}
