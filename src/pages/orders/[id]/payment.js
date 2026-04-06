import { getOrderById } from "@/lib/db";
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

function formatRs(value) {
  const amount = Number(value || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `Rs ${amount}`;
}

export default function OrderPaymentPage({ order }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(dateValue(new Date()));
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
          payment_date: paymentDate,
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
        <title>Payment | Order #{order.id} | AD Electronics</title>
      </Head>

      <section className="mx-auto w-full max-w-xl space-y-5 rounded-3xl border border-amber-200 bg-[linear-gradient(150deg,#fff8eb,#ffffff)] p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Make Payment</h2>
          <p className="text-sm text-slate-600">
            Order #{order.id} for {order.customer_name}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            Remaining balance: {formatRs(order.remaining_balance)}
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
                htmlFor="paymentDatePage"
              >
                Payment Date
              </label>
              <input
                id="paymentDatePage"
                type="date"
                required
                value={paymentDate}
                onChange={(event) => setPaymentDate(event.target.value)}
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
                className="rounded-xl bg-[linear-gradient(135deg,#f59e0b,#d97706)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
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

    const orderId = Number(id);
    if (!Number.isFinite(orderId)) {
      return { notFound: true };
    }

    const order = await getOrderById(orderId);

    if (!order) {
      return { notFound: true };
    }

    return {
      props: {
        order: JSON.parse(JSON.stringify(order)),
      },
    };
  },
);
