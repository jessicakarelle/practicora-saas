import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";
import copy from "@/i18n/locales/fr/common/not-found.json";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary-softer text-primary"><FileQuestion className="size-6" /></span>
        <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.14em] text-primary">404</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.04em]">{copy.title}</h1>
        <p className="mt-3 text-[15px] leading-7 text-muted">{copy.description}</p>
        <Link href="/fr" className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-primary bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-strong"><ArrowLeft className="size-4" />{copy.back}</Link>
      </div>
    </main>
  );
}
