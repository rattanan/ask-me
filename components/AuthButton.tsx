"use client";

import Image from "next/image";
import { signIn, signOut } from "next-auth/react";
import { LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/Button";
import type { AuthenticatedUser } from "@/lib/auth";

interface AuthButtonProps {
  user?: AuthenticatedUser | null;
}

export function AuthButton({ user }: AuthButtonProps) {
  if (!user) {
    return (
      <Button variant="secondary" onClick={() => signIn("google", { callbackUrl: "/admin" })}>
        <LogIn className="h-4 w-4" />
        Sign in with Google
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {user.image ? <Image className="rounded-full" src={user.image} alt={user.name} width={36} height={36} /> : null}
      <div className="hidden text-right sm:block">
        <p className="text-sm font-bold text-zinc-950">{user.name}</p>
        <p className="text-xs text-zinc-500">{user.email}</p>
      </div>
      <Button variant="secondary" onClick={() => signOut({ callbackUrl: "/" })}>
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </div>
  );
}
