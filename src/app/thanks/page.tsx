import type { Metadata } from "next";
import Link from "next/link";
import { business } from "@/config";

export const metadata: Metadata = { title: "Request received" };

export default async function ThanksPage({
  searchParams,
}: PageProps<"/thanks">) {
  const { dog } = await searchParams;
  const dogName = typeof dog === "string" ? dog.slice(0, 60) : undefined;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-stone-200">
        <div
          aria-hidden="true"
          className="mx-auto flex size-14 items-center justify-center rounded-full bg-teal-100 text-3xl"
        >
          🐾
        </div>
        <h1 className="mt-4 text-2xl font-bold text-stone-900">
          Request received!
        </h1>
        <p className="mt-3 text-stone-700">
          Thanks{dogName ? ` — we can't wait to meet ${dogName}` : ""}.{" "}
          Your request is saved, and {business.ownerName} will text you to
          confirm an exact time.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg px-4 py-2 font-medium text-teal-800 ring-1 ring-teal-700/30 hover:bg-teal-50"
        >
          Request another appointment
        </Link>
      </div>
    </main>
  );
}
