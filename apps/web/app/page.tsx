import Link from "next/link";
import { headers } from "next/headers";

import { createTranslator, getMessages, resolveLocale } from "@pixel-editor/i18n";

export default async function HomePage() {
  const requestHeaders = await headers();
  const locale = resolveLocale(requestHeaders.get("accept-language"));
  const t = createTranslator(locale, getMessages(locale));

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#052e16_0%,#020617_55%,#111827_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-8 px-6 py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-medium tracking-[0.3em] text-emerald-300 uppercase">
            {t("home.badge")}
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight text-white">
            {t("home.title")}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            {t("home.description")}
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <Link
            className="rounded-full border border-emerald-400/60 bg-emerald-400/10 px-6 py-3 text-sm font-medium text-emerald-100 transition hover:bg-emerald-400/20"
            href="/projects/demo-project"
          >
            {t("home.openExampleProject")}
          </Link>
          <Link
            className="rounded-full border border-sky-700 bg-sky-900/40 px-6 py-3 text-sm font-medium text-sky-100 transition hover:border-sky-500"
            href="/api/example-projects/demo-project/project"
          >
            {t("home.viewExampleJson")}
          </Link>
          <Link
            className="rounded-full border border-slate-700 bg-slate-900/70 px-6 py-3 text-sm font-medium text-slate-100 transition hover:border-slate-500"
            href="/api/health"
          >
            {t("home.healthEndpoint")}
          </Link>
        </div>
      </div>
    </main>
  );
}
