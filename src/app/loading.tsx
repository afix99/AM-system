import { PageSkeleton } from "@/components/ui/PageSkeleton";

export default function Loading() {
  return <PageSkeleton label="Overview" title="Dashboard" stats={3} rows={4} />;
}
