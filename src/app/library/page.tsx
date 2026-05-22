import { prisma } from "@/lib/prisma";
import { LibraryClient } from "@/components/library/LibraryClient";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const entries = await prisma.libraryEntry.findMany({
    orderBy: [{ category: "asc" }, { title: "asc" }],
  });
  return <LibraryClient initialEntries={JSON.parse(JSON.stringify(entries))} />;
}
