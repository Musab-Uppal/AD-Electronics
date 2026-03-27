import AlertCard from "@/components/AlertCard";
import { getDashboardData } from "@/lib/dashboard";
import {
  getDatabaseConnectionHelpMessage,
  isDatabaseConnectionError,
} from "@/lib/db";
import { withPageAuth } from "@/lib/session";
import Head from "next/head";
import Link from "next/link";

function currency(value) {
  const amount = Number(value || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `Rs ${amount}`;
}

export default function DashboardPage({ overdue, upcoming, stats, dbError }) {
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

        <div className="grain-overlay relative overflow-hidden rounded-3xl border border-amber-200 bg-[linear-gradient(115deg,_#fff4e0,_#fffbf2_42%,_#e0f2fe)] p-6 shadow-sm">
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
                className="rounded-xl bg-[linear-gradient(135deg,_#f59e0b,_#d97706)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
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
          <article className="overflow-hidden rounded-2xl border border-red-200 bg-[linear-gradient(160deg,_#fef2f2,_#ffe4e6)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
              Overdue Orders
            </p>
            <p className="mt-2 text-2xl font-black text-red-900">
              {stats.overdueCount}
            </p>
          </article>
          <article className="overflow-hidden rounded-2xl border border-amber-200 bg-[linear-gradient(160deg,_#fffbeb,_#fef3c7)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              Upcoming This Week
            </p>
            <p className="mt-2 text-2xl font-black text-amber-900">
              {stats.upcomingThisWeekCount}
            </p>
          </article>
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
                <article
                  key={order.id}
                  className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm"
                >
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
              ))}
            </div>
          )}
        </div>
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
