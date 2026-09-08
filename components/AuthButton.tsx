"use client";

import Image from "next/image";
import { useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/Button";
import type { AuthenticatedUser } from "@/lib/auth";

interface AuthButtonProps {
  user?: AuthenticatedUser | null;
}

export function AuthButton({ user }: AuthButtonProps) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
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
      {user.image && failedImage !== user.image ? (
        <Image
          className="h-9 w-9 shrink-0 rounded-full object-cover"
          src={user.image}
          alt={user.name}
          width={36}
          height={36}
          onError={() => setFailedImage(user.image)}
        />
      ) : (
        <span role="img" aria-label={user.name} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
          {Array.from(user.name.trim())[0]?.toUpperCase() || "?"}
        </span>
      )}
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
