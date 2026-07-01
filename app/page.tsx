import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { Calendar, Settings } from "lucide-react";
import { AuthButton } from "@/components/AuthButton";
import { getCurrentUser } from "@/lib/auth";
import { getPublicActiveSession } from "@/lib/storage";
import { getQuestionUrl } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  const session = await getPublicActiveSession();
  const headerStore = await headers();
  const host = headerStore.get("host") ?? "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  const origin = `${protocol}://${host}`;
  const questionUrl = session ? getQuestionUrl(session.id, origin) : "";
  const qrCode = questionUrl ? await QRCode.toDataURL(questionUrl, { margin: 1, width: 280 }) : "";

  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8">
        <nav className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">Live Question Wall</p>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Ask, watch, discuss.</h1>
          </div>
          <AuthButton user={user} />
        </nav>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              <Calendar className="h-4 w-4" />
              {session ? "Questions are open" : "Ready for your next lecture"}
            </div>
            <h2 className="text-5xl font-bold leading-tight tracking-tight text-zinc-950 sm:text-7xl">
              {session?.title ?? "Create your first lecture"}
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-600">
              {session?.description || "Collect audience questions instantly and show them as calm, readable sticky notes on the big screen."}
            </p>
            {session?.presenter ? <p className="mt-4 text-base font-semibold text-zinc-800">Presented by {session.presenter}</p> : null}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {session ? (
                <Link className="inline-flex h-14 items-center justify-center rounded-2xl bg-blue-600 px-6 text-base font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700" href={`/question/${session.id}`}>
                  Ask a Question
                </Link>
              ) : null}
              <Link className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl px-6 text-base font-bold text-zinc-700 transition hover:bg-zinc-50" href="/admin">
                <Settings className="h-5 w-5" />
                Manage
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-zinc-100 bg-zinc-50 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
            <div className="rounded-[1.5rem] bg-white p-6 text-center shadow-sm">
              {qrCode ? <Image className="mx-auto h-64 w-64" src={qrCode} alt={`QR code for ${session?.title}`} width={256} height={256} unoptimized /> : <div className="grid h-64 place-items-center rounded-3xl bg-zinc-100 text-zinc-500">No active lecture</div>}
              <p className="mt-4 text-sm font-semibold text-zinc-500">Scan to submit a question</p>
              <p className="mt-2 break-all text-xs text-zinc-400">{questionUrl || "Create a session in Admin"}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
