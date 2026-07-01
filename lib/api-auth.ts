import { NextResponse } from "next/server";
import { getCurrentUser, type AuthenticatedUser } from "@/lib/auth";

export async function withAdminUser(): Promise<AuthenticatedUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
}

export function isAuthResponse(value: AuthenticatedUser | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}
