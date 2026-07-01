import Link from "next/link";
import { AuthButton } from "@/components/AuthButton";
import { getCurrentUser } from "@/lib/auth";

interface LoginPageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

const authErrorMessages: Record<string, string> = {
  Configuration: "Authentication is not configured yet. Check GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET, and NEXTAUTH_URL.",
  OAuthSignin: "Google sign-in could not start. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local, then restart the dev server.",
  OAuthCallback: "Google returned an error during sign-in. Check the authorized callback URL in Google Cloud Console.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const errorMessage = params.error ? authErrorMessages[params.error] ?? "Sign-in failed. Please check your authentication configuration." : "";

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 px-5">
      <section className="w-full max-w-md rounded-[2rem] bg-white p-8 text-center shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-semibold text-blue-600">Live Question Wall</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">Admin Sign In</h1>
        <p className="mt-3 text-zinc-600">Use your Google account to manage lectures, moderate questions, and open the wall.</p>
        {errorMessage ? <p className="mt-5 rounded-2xl bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-700">{errorMessage}</p> : null}
        <div className="mt-8 flex justify-center">
          <AuthButton user={user} />
        </div>
        <Link className="mt-6 inline-block text-sm font-semibold text-zinc-500 hover:text-blue-600" href="/">
          Back to public page
        </Link>
      </section>
    </main>
  );
}
