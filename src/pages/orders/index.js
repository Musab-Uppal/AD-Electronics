import { listOrders } from "@/lib/db";
import { withPageAuth } from "@/lib/session";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toISOString().slice(0, 10);
}

function currency(value) {
  const amount = Number(value || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `Rs ${amount}`;
}

export default function OrdersPage({ orders, filter, phone }) {
  const router = useRouter();

  function setFilter(nextFilter) {
    const params = new URLSearchParams();
    if (nextFilter && nextFilter !== "pending") {
      params.set("filter", nextFilter);
    }
    if (phone) {
      params.set("phone", phone);
    }

    const queryString = params.toString();
    router.push(queryString ? `/orders?${queryString}` : "/orders");
  }

  return (
    <>
      <Head>
        <title>Orders | AD Electronics</title>
      </Head>

      <section className="space-y-5">
        <div className="grain-overlay relative overflow-hidden rounded-3xl border border-amber-200 bg-[linear-gradient(115deg,_#fff4e0,_#fffbf2_42%,_#e0f2fe)] p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                AD Electronics Records
              </p>
              <h2 className="mt-1 text-3xl font-black text-slate-900">
                Orders
              </h2>
              {phone ? (
                <p className="mt-1 text-sm text-slate-600">
                  Filtered for phone: {phone}
                </p>
              ) : (
                <p className="mt-1 text-sm text-slate-600">
                  Track all installment orders and payment status.
                </p>
              )}
            </div>
            <Link
              href="/orders/add"
              className="rounded-xl bg-[linear-gradient(135deg,_#f59e0b,_#d97706)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Add New Order
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: "All" },
            { key: "pending", label: "Pending" },
            { key: "complete", label: "Complete" },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setFilter(option.key)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                filter === option.key
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Customer Name</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Items</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Advance</th>
                <th className="px-4 py-3 font-semibold">Remaining</th>
                <th className="px-4 py-3 font-semibold">Purchase Date</th>
                <th className="px-4 py-3 font-semibold">Next Payment Date</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {orders.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-4 text-center text-slate-500"
                    colSpan={10}
                  >
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-amber-50/30">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {order.customer_name}
                    </td>
                    <td className="px-4 py-3">{order.customer_phone}</td>
                    <td className="max-w-xs px-4 py-3">{order.items}</td>
                    <td className="px-4 py-3">{currency(order.total)}</td>
                    <td className="px-4 py-3">
                      {currency(order.advance_payment)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {currency(order.remaining_balance)}
                    </td>
                    <td className="px-4 py-3">
                      {formatDate(order.purchase_date)}
                    </td>
                    <td className="px-4 py-3">
                      {formatDate(order.next_payment_date)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          order.is_complete
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {order.is_complete ? "Complete" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        {!order.is_complete ? (
                          <Link
                            href={`/orders/${order.id}/payment`}
                            className="font-semibold text-amber-700 hover:text-amber-900"
                          >
                            Make Payment
                          </Link>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                        <Link
                          href={`/orders/${order.id}`}
                          className="font-semibold text-slate-700 hover:text-slate-900"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export const getServerSideProps = withPageAuth(
  async function getServerSideProps(context) {
    const filter = String(context.query.filter || "pending");
    const phone = String(context.query.phone || "").trim();

    const orders = await listOrders({ filter, phone });

    return {
      props: {
        orders: JSON.parse(JSON.stringify(orders)),
        filter,
        phone,
      },
    };
  },
);
