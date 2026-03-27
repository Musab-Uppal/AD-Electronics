import PaymentModal from "@/components/PaymentModal";
import { query } from "@/lib/db";
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

function currency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

export default function OrderDetailsPage({ order }) {
  const router = useRouter();
  const [openPaymentModal, setOpenPaymentModal] = useState(false);

  function handleSuccess() {
    setOpenPaymentModal(false);
    router.replace(router.asPath);
  }

  return (
    <>
      <Head>
        <title>Order #{order.id} | Installment Desk</title>
      </Head>

      <section className="mx-auto w-full max-w-3xl space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-slate-900">
            Order #{order.id}
          </h2>
          <div className="flex items-center gap-2">
            <Link
              href="/orders"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Back to Orders
            </Link>
            {!order.is_complete ? (
              <>
                <button
                  type="button"
                  onClick={() => setOpenPaymentModal(true)}
                  className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                >
                  Make Payment (Modal)
                </button>
                <Link
                  href={`/orders/${order.id}/payment`}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Go to Payment Page
                </Link>
              </>
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
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Items
            </p>
            <p className="mt-1 text-slate-900">{order.items}</p>
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

    const rows = await query(
      `
      SELECT id, customer_name, customer_phone, items, total, advance_payment, remaining_balance,
             purchase_date, next_payment_date, is_complete
      FROM orders
      WHERE id = ?
      LIMIT 1
    `,
      [id],
    );

    if (rows.length === 0) {
      return { notFound: true };
    }

    return {
      props: {
        order: JSON.parse(JSON.stringify(rows[0])),
      },
    };
  },
);
