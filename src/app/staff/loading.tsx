import { PageSkeleton } from "@/components/ui/PageSkeleton";

export default function Loading() {
  return <PageSkeleton label="Team" title="Staff Directory" stats={4} rows={6} />;
}
