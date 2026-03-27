import { query } from "@/lib/db";
import { withPageAuth } from "@/lib/session";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import toast from "react-hot-toast";

function dateValue(value) {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  return new Date(value).toISOString().slice(0, 10);
}

export default function OrderPaymentPage({ order }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [nextPaymentDate, setNextPaymentDate] = useState(
    dateValue(order.next_payment_date),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/orders/${order.id}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(amount),
          next_payment_date: nextPaymentDate,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Payment failed");
      }

      toast.success("Payment recorded");
      await router.push(`/orders/${order.id}`);
    } catch (error) {
      toast.error(error.message || "Could not record payment");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Head>
        <title>Payment | Order #{order.id}</title>
      </Head>

      <section className="mx-auto w-full max-w-xl space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Make Payment</h2>
          <p className="text-sm text-slate-600">
            Order #{order.id} for {order.customer_name}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            Remaining balance: $
            {Number(order.remaining_balance || 0).toFixed(2)}
          </p>
        </div>

        {order.is_complete ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            This order is already complete.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="mb-1 block text-sm font-medium text-slate-700"
                htmlFor="paymentAmountPage"
              >
                Amount
              </label>
              <input
                id="paymentAmountPage"
                type="number"
                step="0.01"
                min="0"
                required
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-amber-200 transition focus:ring"
              />
            </div>

            <div>
              <label
                className="mb-1 block text-sm font-medium text-slate-700"
                htmlFor="nextPaymentDatePage"
              >
                Next Payment Date
              </label>
              <input
                id="nextPaymentDatePage"
                type="date"
                required
                value={nextPaymentDate}
                onChange={(event) => setNextPaymentDate(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-amber-200 transition focus:ring"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Link
                href={`/orders/${order.id}`}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Saving..." : "Save Payment"}
              </button>
            </div>
          </form>
        )}
      </section>
    </>
  );
}

export const getServerSideProps = withPageAuth(
  async function getServerSideProps(context) {
    const { id } = context.params;

    const rows = await query(
      "SELECT id, customer_name, remaining_balance, next_payment_date, is_complete FROM orders WHERE id = ? LIMIT 1",
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
