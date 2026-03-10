import { GroupDetailClient } from "@/components/groups/group-detail-client";

export const dynamic = "force-dynamic";

interface GroupDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function GroupDetailPage({ params }: GroupDetailPageProps) {
  const { id } = await params;
  return <GroupDetailClient id={id} />;
}
