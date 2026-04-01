import PaymentModal from "@/components/PaymentModal";
import { getOrderById, listOrderPayments } from "@/lib/db";
import { withPageAuth } from "@/lib/session";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toISOString().slice(0, 10);
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("en-PK", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function currency(value) {
  const amount = Number(value || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `Rs ${amount}`;
}

export default function OrderDetailsPage({ order, payments }) {
  const router = useRouter();
  const [openPaymentModal, setOpenPaymentModal] = useState(false);

  function handleSuccess() {
    setOpenPaymentModal(false);
    router.replace(router.asPath);
  }

  return (
    <>
      <Head>
        <title>Order #{order.id} | AD Electronics</title>
      </Head>

      <section className="mx-auto w-full max-w-3xl space-y-5 rounded-3xl border border-amber-200 bg-[linear-gradient(150deg,#fff8eb,#ffffff)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-slate-900">
            Order #{order.id}
          </h2>
          <div className="flex items-center gap-2">
            <Link
              href="/orders"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Back to Orders
            </Link>
            {!order.is_complete ? (
              <button
                type="button"
                onClick={() => setOpenPaymentModal(true)}
                className="rounded-xl bg-[linear-gradient(135deg,#f59e0b,#d97706)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Make Payment
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Customer Name
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {order.customer_name}
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Phone
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {order.customer_phone}
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Overall Time
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {order.overall_time ? `${order.overall_time} months` : "-"}
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Items
            </p>
            <p className="mt-1 whitespace-pre-line text-slate-900">
              {order.items}
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Total
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {currency(order.total)}
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Advance Payment
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {currency(order.advance_payment)}
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Remaining Balance
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {currency(order.remaining_balance)}
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Purchase Date
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {formatDate(order.purchase_date)}
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Next Payment Date
            </p>
            <p className="mt-1 font-semibold text-slate-900">
              {formatDate(order.next_payment_date)}
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Status
            </p>
            <p
              className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                order.is_complete
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {order.is_complete ? "Complete" : "Pending"}
            </p>
          </article>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">
              Payment History
            </h3>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {payments.length} record{payments.length === 1 ? "" : "s"}
            </p>
          </div>

          {payments.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No payments recorded yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date and Time</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="bg-white">
                      <td className="px-4 py-3 text-slate-700">
                        {formatDateTime(payment.payment_date)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            payment.payment_source === "advance"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {payment.payment_source === "advance"
                            ? "Advance"
                            : "Installment"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {currency(payment.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {openPaymentModal ? (
        <PaymentModal
          orderId={order.id}
          currentRemaining={order.remaining_balance}
          initialDate={
            formatDate(order.next_payment_date) === "-"
              ? ""
              : formatDate(order.next_payment_date)
          }
          onClose={() => setOpenPaymentModal(false)}
          onSuccess={handleSuccess}
        />
      ) : null}
    </>
  );
}

export const getServerSideProps = withPageAuth(
  async function getServerSideProps(context) {
    const { id } = context.params;
    const orderId = Number(id);

    if (!Number.isFinite(orderId)) {
      return { notFound: true };
    }

    const [order, payments] = await Promise.all([
      getOrderById(orderId),
      listOrderPayments(orderId),
    ]);

    if (!order) {
      return { notFound: true };
    }

    return {
      props: {
        order: JSON.parse(JSON.stringify(order)),
        payments: JSON.parse(JSON.stringify(payments)),
      },
    };
  },
);
