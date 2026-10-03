import type { Metadata } from "next";
import Link from "next/link";
import { business } from "@/config";
import { DemoBanner } from "@/components/demo-banner";
import {
  LIST_LIMIT,
  countRequestsByStatus,
  listRequestsByStatus,
} from "@/db/queries";
import type { AppointmentRequest } from "@/db/schema";
import { requireOwner } from "@/lib/auth";
import {
  STATUSES,
  statusValues,
  todayInTimeZone,
  type Status,
} from "@/lib/booking";
import { formatDate } from "@/lib/format";
import { logout } from "../login/actions";
import { AutoRefresh } from "./auto-refresh";
import { RequestCard } from "./request-card";

export const metadata: Metadata = { title: "Dashboard" };

const TAB_LABELS: Record<Status, string> = {
  new: "New requests",
  confirmed: "Upcoming",
  completed: "Completed",
  declined: "Declined",
};

const EMPTY_TEXT: Record<Status, string> = {
  new: "No new requests. You'll get a phone alert when one comes in.",
  confirmed: "No upcoming appointments.",
  completed: "Nothing completed yet.",
  declined: "No declined requests.",
};

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  await requireOwner();

  const { status: rawStatus } = await searchParams;
  const status: Status = statusValues.includes(rawStatus as Status)
    ? (rawStatus as Status)
    : "new";

  const [counts, requests] = await Promise.all([
    countRequestsByStatus(),
    listRequestsByStatus(status),
  ]);
  const today = todayInTimeZone(business.timeZone);

  return (
    <main className="flex-1">
      <AutoRefresh />
      <DemoBanner>
        Public demo: anyone with the demo password can see and change this data.
      </DemoBanner>
      <header className="bg-teal-800 text-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <h1 className="text-lg font-bold">Booking requests</h1>
            <p className="text-sm text-teal-100">{business.name}</p>
          </div>
          <form action={logout}>
            <button className="rounded-lg px-3 py-1.5 text-sm text-teal-50 ring-1 ring-teal-300/40 hover:bg-teal-700">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6">
        <nav aria-label="Request status" className="-mx-4 overflow-x-auto px-4">
          <ul className="flex min-w-max gap-2">
            {statusValues.map((s) => {
              const active = s === status;
              return (
                <li key={s}>
                  <Link
                    href={s === "new" ? "/dashboard" : `/dashboard?status=${s}`}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                      active
                        ? "bg-teal-700 text-white"
                        : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    {TAB_LABELS[s]}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        active
                          ? "bg-white/20"
                          : s === "new" && counts.new > 0
                            ? "bg-amber-400 text-amber-950"
                            : "bg-stone-100"
                      }`}
                    >
                      {counts[s]}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <section aria-label={STATUSES[status]} className="mt-6">
          {counts[status] > requests.length && (
            <p className="mb-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-900 ring-1 ring-amber-200">
              Showing the first {LIST_LIMIT} of {counts[status]}.{" "}
              {status === "new"
                ? "Work through these and the rest will appear."
                : "Older history is kept but not listed here."}
            </p>
          )}
          {requests.length === 0 ? (
            <p className="rounded-xl border border-dashed border-stone-300 bg-white px-4 py-10 text-center text-stone-600">
              {EMPTY_TEXT[status]}
            </p>
          ) : status === "confirmed" ? (
            <ScheduleByDay requests={requests} today={today} />
          ) : (
            <div className="space-y-4">
              {requests.map((r) => (
                <RequestCard key={r.id} req={r} today={today} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

/** Upcoming jobs grouped under a heading per day, in date order. */
function ScheduleByDay({
  requests,
  today,
}: {
  requests: AppointmentRequest[];
  today: string;
}) {
  const days = new Map<string, AppointmentRequest[]>();
  for (const r of requests) {
    const day = r.confirmedDate ?? r.preferredDate;
    days.set(day, [...(days.get(day) ?? []), r]);
  }

  return (
    <div className="space-y-8">
      {[...days].map(([day, dayRequests]) => (
        <div key={day}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-600">
            {formatDate(day)} · {dayRequests.length} job
            {dayRequests.length === 1 ? "" : "s"}
          </h2>
          <div className="space-y-4">
            {dayRequests.map((r) => (
              <RequestCard key={r.id} req={r} today={today} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
