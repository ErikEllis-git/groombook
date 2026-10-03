import Link from "next/link";
import { connection } from "next/server";
import { business } from "@/config";
import { todayInTimeZone } from "@/lib/booking";
import { BookingForm } from "./booking-form";

const steps = [
  { title: "Send a request", text: "Tell us about your dog and when suits you." },
  { title: "Kevin confirms", text: "You'll get a text with your exact time." },
  { title: "We come to you", text: "The grooming van pulls up at your door." },
];

export default async function Home() {
  // Render per request so the earliest selectable date is always today.
  await connection();
  const today = todayInTimeZone(business.timeZone);

  return (
    <main className="flex-1">
      <header className="bg-teal-800 text-white">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
          <p className="text-sm font-medium uppercase tracking-wide text-teal-200">
            Mobile dog grooming
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{business.name}</h1>
          <p className="mt-3 max-w-xl text-lg text-teal-50">
            Request a grooming appointment in under a minute. We bring the salon
            to your driveway.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4">
        <ol className="-mt-6 divide-y divide-stone-100 rounded-xl bg-white shadow-sm ring-1 ring-stone-200 sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-3 p-4">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-800">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-stone-900">{s.title}</p>
                <p className="text-sm text-stone-600">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="my-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 sm:p-8">
          <BookingForm minDate={today} />
        </div>
      </div>

      <footer className="pb-10 text-center text-sm text-stone-500">
        <Link href="/dashboard" className="underline-offset-4 hover:underline">
          Owner login
        </Link>
      </footer>
    </main>
  );
}
