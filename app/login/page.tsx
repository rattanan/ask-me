import Link from "next/link";
import { AuthButton } from "@/components/AuthButton";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 px-5">
      <section className="w-full max-w-md rounded-[2rem] bg-white p-8 text-center shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-semibold text-blue-600">Live Question Wall</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">Admin Sign In</h1>
        <p className="mt-3 text-zinc-600">Use your Google account to manage lectures, moderate questions, and open the wall.</p>
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
