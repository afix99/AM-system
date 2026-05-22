import { PageSkeleton } from "@/components/ui/PageSkeleton";

export default function Loading() {
  return <PageSkeleton label="Store Detail" title="Loading…" rows={4} />;
}
