import { headers } from "next/headers";
import { AdminHome } from "@/features/admin/AdminHome";
import { getSessions } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const headerStore = await headers();
  const host = headerStore.get("host") ?? "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  return <AdminHome initialOrigin={`${protocol}://${host}`} initialSessions={await getSessions()} />;
}
