import AlertCard from "@/components/AlertCard";
import { getDashboardData } from "@/lib/dashboard";
import {
  getDatabaseConnectionHelpMessage,
  isDatabaseConnectionError,
} from "@/lib/db";
import { withPageAuth } from "@/lib/session";
import Head from "next/head";
import Link from "next/link";
import { useMemo, useState } from "react";

function currency(value) {
  const amount = Number(value || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `Rs ${amount}`;
}

function getWeekEndDate() {
  const today = new Date();
  const day = today.getDay();
  const diffToSunday = day === 0 ? 0 : 7 - day;
  const sunday = new Date(today);
  sunday.setDate(today.getDate() + diffToSunday);
  return sunday.toISOString().slice(0, 10);
}

export default function DashboardPage({ overdue, upcoming, stats, dbError }) {
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const [showUpcomingWeekModal, setShowUpcomingWeekModal] = useState(false);

  const upcomingThisWeek = useMemo(() => {
    const weekEnd = getWeekEndDate();
    return upcoming.filter((order) => {
      const nextDate = String(order.next_payment_date || "").trim();
      return nextDate && nextDate <= weekEnd;
    });
  }, [upcoming]);

  return (
    <>
      <Head>
        <title>Dashboard | AD Electronics</title>
      </Head>

      <section className="space-y-6">
        {dbError ? (
          <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-900">
            {dbError}
          </div>
        ) : null}

        <div className="grain-overlay relative overflow-hidden rounded-3xl border border-amber-200 bg-[linear-gradient(115deg,#fff4e0,#fffbf2_42%,#e0f2fe)] p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                AD Electronics Insights
              </p>
              <h2 className="mt-1 text-3xl font-black text-slate-900">
                Dashboard
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Track overdue collections and upcoming payment commitments.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/customers/add"
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-300 transition hover:bg-slate-50"
              >
                Add Customer
              </Link>
              <Link
                href="/orders/add"
                className="rounded-xl bg-[linear-gradient(135deg,#f59e0b,#d97706)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Add Order
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total Outstanding
            </p>
            <p className="mt-2 text-2xl font-black text-slate-900">
              {currency(stats.totalOutstanding)}
            </p>
          </article>
          <button
            type="button"
            onClick={() => setShowOverdueModal(true)}
            disabled={stats.overdueCount === 0}
            className="overflow-hidden rounded-2xl border border-red-200 bg-[linear-gradient(160deg,#fef2f2,#ffe4e6)] p-4 text-left shadow-sm transition enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
              Overdue Orders
            </p>
            <p className="mt-2 text-2xl font-black text-red-900">
              {stats.overdueCount}
            </p>
            <p className="mt-2 text-xs font-medium text-red-800">
              {stats.overdueCount > 0
                ? "Click to view all"
                : "No overdue orders"}
            </p>
          </button>
          <button
            type="button"
            onClick={() => setShowUpcomingWeekModal(true)}
            disabled={stats.upcomingThisWeekCount === 0}
            className="overflow-hidden rounded-2xl border border-amber-200 bg-[linear-gradient(160deg,#fffbeb,#fef3c7)] p-4 text-left shadow-sm transition enabled:hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              Upcoming This Week
            </p>
            <p className="mt-2 text-2xl font-black text-amber-900">
              {stats.upcomingThisWeekCount}
            </p>
            <p className="mt-2 text-xs font-medium text-amber-800">
              {stats.upcomingThisWeekCount > 0
                ? "Click to view all"
                : "No payments due this week"}
            </p>
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-bold text-red-900">Overdue Alerts</h3>
          {overdue.length === 0 ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
              No overdue orders. Great job staying on top of collections.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {overdue.map((order) => (
                <AlertCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-bold text-amber-900">
            Upcoming Payments
          </h3>
          {upcoming.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              No upcoming payments scheduled.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {upcoming.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="group block rounded-2xl outline-none ring-amber-200 transition focus-visible:ring-2"
                >
                  <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm transition group-hover:-translate-y-0.5 group-hover:shadow-md">
                    <h4 className="text-base font-bold text-amber-900">
                      {order.customer_name}
                    </h4>
                    <p className="text-sm text-amber-800">
                      Phone: {order.customer_phone}
                    </p>
                    <p className="mt-2 text-sm text-amber-900">
                      <span className="font-semibold">Remaining:</span>{" "}
                      {currency(order.remaining_balance)}
                    </p>
                    <p className="text-sm text-amber-900">
                      <span className="font-semibold">Next Payment:</span>{" "}
                      {order.next_payment_date}
                    </p>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>

        {showOverdueModal ? (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/45 p-4 pt-20 sm:items-center sm:pt-4">
            <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-red-200 bg-white p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Overdue Orders
                  </h3>
                  <p className="text-sm text-slate-600">
                    {overdue.length} overdue order
                    {overdue.length === 1 ? "" : "s"}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOverdueModal(false)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Close
                </button>
              </div>

              {overdue.length === 0 ? (
                <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  No overdue orders.
                </p>
              ) : (
                <div className="space-y-3">
                  {overdue.map((order) => (
                    <article
                      key={order.id}
                      className="rounded-xl border border-red-200 bg-red-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-red-900">
                            {order.customer_name}
                          </h4>
                          <p className="text-sm text-red-800">
                            Phone: {order.customer_phone}
                          </p>
                          <p className="mt-1 text-sm text-red-900">
                            Next Payment: {order.next_payment_date}
                          </p>
                          <p className="text-sm text-red-900">
                            Overdue by {order.overdue_days} day
                            {order.overdue_days === 1 ? "" : "s"}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-red-900">
                          {currency(order.remaining_balance)}
                        </p>
                      </div>
                      <div className="mt-2">
                        <Link
                          href={`/orders/${order.id}`}
                          className="text-sm font-semibold text-red-900 underline-offset-2 hover:underline"
                        >
                          View Order
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {showUpcomingWeekModal ? (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/45 p-4 pt-20 sm:items-center sm:pt-4">
            <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-amber-200 bg-white p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Upcoming Payments This Week
                  </h3>
                  <p className="text-sm text-slate-600">
                    {upcomingThisWeek.length} payment
                    {upcomingThisWeek.length === 1 ? "" : "s"} scheduled before
                    week end.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUpcomingWeekModal(false)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Close
                </button>
              </div>

              {upcomingThisWeek.length === 0 ? (
                <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  No upcoming payments this week.
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingThisWeek.map((order) => (
                    <article
                      key={order.id}
                      className="rounded-xl border border-amber-200 bg-amber-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-amber-900">
                            {order.customer_name}
                          </h4>
                          <p className="text-sm text-amber-800">
                            Phone: {order.customer_phone}
                          </p>
                          <p className="mt-1 text-sm text-amber-900">
                            Next Payment: {order.next_payment_date}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-amber-900">
                          {currency(order.remaining_balance)}
                        </p>
                      </div>
                      <div className="mt-2">
                        <Link
                          href={`/orders/${order.id}`}
                          className="text-sm font-semibold text-amber-900 underline-offset-2 hover:underline"
                        >
                          View Order
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}

export const getServerSideProps = withPageAuth(
  async function getServerSideProps() {
    try {
      const data = await getDashboardData();

      return {
        props: {
          ...data,
          dbError: null,
        },
      };
    } catch (error) {
      if (!isDatabaseConnectionError(error)) {
        throw error;
      }

      return {
        props: {
          overdue: [],
          upcoming: [],
          stats: {
            totalOutstanding: 0,
            overdueCount: 0,
            upcomingThisWeekCount: 0,
          },
          dbError: getDatabaseConnectionHelpMessage(),
        },
      };
    }
  },
);
