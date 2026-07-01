import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminHome } from "@/features/admin/AdminHome";
import { getCurrentUser } from "@/lib/auth";
import { getOwnedSessions } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const headerStore = await headers();
  const host = headerStore.get("host") ?? "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  const sessions = await getOwnedSessions(user.id);
  return <AdminHome initialOrigin={`${protocol}://${host}`} initialSessions={sessions} user={user} />;
}
