import type { Account, NextAuthOptions, Profile, Session as AuthSession } from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getUserByEmail, upsertUser } from "@/lib/storage";

interface GoogleProfile extends Profile {
  sub?: string;
  picture?: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (!account || account.provider !== "google" || !profile?.email) {
        return false;
      }
      const googleProfile = profile as GoogleProfile;
      await upsertUser({
        googleId: account.providerAccountId || googleProfile.sub || profile.email,
        email: profile.email,
        name: profile.name ?? profile.email,
        image: googleProfile.picture ?? "",
      });
      return true;
    },
    async session({ session }) {
      if (!session.user?.email) {
        return session;
      }
      const user = await getUserByEmail(session.user.email);
      if (!user) {
        return session;
      }
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
          googleId: user.googleId,
          image: user.image || session.user.image,
        },
      };
    },
  },
  pages: {
    signIn: "/login",
  },
};

export interface AuthenticatedUser {
  id: string;
  googleId: string;
  email: string;
  name: string;
  image: string;
}

interface ExtendedAuthSession extends AuthSession {
  user: AuthSession["user"] & {
    id?: string;
    googleId?: string;
  };
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = (await getServerSession(authOptions)) as ExtendedAuthSession | null;
  if (!session?.user?.id || !session.user.email) {
    return null;
  }
  return {
    id: session.user.id,
    googleId: session.user.googleId ?? session.user.id,
    email: session.user.email,
    name: session.user.name ?? session.user.email,
    image: session.user.image ?? "",
  };
}

export async function requireCurrentUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export function getProviderAccountId(account: Account | null): string {
  return account?.providerAccountId ?? "";
}
