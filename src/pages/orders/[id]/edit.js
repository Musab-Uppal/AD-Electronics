import { getOrderById, listCustomerOptions } from "@/lib/db";
import { withPageAuth } from "@/lib/session";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import toast from "react-hot-toast";

function dateValue(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

export default function EditOrderPage({ order, customers }) {
  const router = useRouter();
  const [form, setForm] = useState({
    customer_phone: order.customer_phone || "",
    overall_time:
      order.overall_time === null || order.overall_time === undefined
        ? ""
        : String(order.overall_time),
    items: order.items || "",
    purchase_date: dateValue(order.purchase_date),
    next_payment_date: dateValue(order.next_payment_date),
    is_complete: Boolean(order.is_complete),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const overallTimeNumber = Math.floor(Number(form.overall_time));
    if (!Number.isFinite(overallTimeNumber) || overallTimeNumber <= 0) {
      toast.error("Overall time must be a positive integer");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_phone: form.customer_phone,
          overall_time: overallTimeNumber,
          items: String(form.items || "").trim(),
          purchase_date: form.purchase_date,
          next_payment_date: form.next_payment_date || null,
          is_complete: form.is_complete,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Failed to update order");
      }

      toast.success("Order updated");
      await router.push(`/orders/${order.id}`);
    } catch (error) {
      toast.error(error.message || "Could not update order");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Head>
        <title>Edit Order #{order.id} | AD Electronics</title>
      </Head>

      <section className="mx-auto w-full max-w-3xl space-y-5 rounded-3xl border border-amber-200 bg-[linear-gradient(150deg,#fff8eb,#ffffff)] p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Edit Order</h2>
          <p className="text-sm text-slate-600">
            Update order #{order.id} details.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="mb-1 block text-sm font-medium text-slate-700"
              htmlFor="editCustomerPhone"
            >
              Customer
            </label>
            <select
              id="editCustomerPhone"
              required
              value={form.customer_phone}
              onChange={(event) =>
                updateField("customer_phone", event.target.value)
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-amber-200 transition focus:ring"
            >
              {customers.map((customer) => (
                <option key={customer.phone} value={customer.phone}>
                  {customer.name} ({customer.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="mb-1 block text-sm font-medium text-slate-700"
              htmlFor="editOverallTime"
            >
              Overall Time (months)
            </label>
            <input
              id="editOverallTime"
              required
              type="number"
              min="1"
              step="1"
              value={form.overall_time}
              onChange={(event) =>
                updateField("overall_time", event.target.value)
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-amber-200 transition focus:ring"
            />
          </div>

          <div>
            <label
              className="mb-1 block text-sm font-medium text-slate-700"
              htmlFor="editItems"
            >
              Items
            </label>
            <textarea
              id="editItems"
              required
              rows={5}
              value={form.items}
              onChange={(event) => updateField("items", event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-amber-200 transition focus:ring"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                className="mb-1 block text-sm font-medium text-slate-700"
                htmlFor="editPurchaseDate"
              >
                Purchase Date
              </label>
              <input
                id="editPurchaseDate"
                required
                type="date"
                value={form.purchase_date}
                onChange={(event) =>
                  updateField("purchase_date", event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-amber-200 transition focus:ring"
              />
            </div>

            <div>
              <label
                className="mb-1 block text-sm font-medium text-slate-700"
                htmlFor="editNextPaymentDate"
              >
                Next Payment Date
              </label>
              <input
                id="editNextPaymentDate"
                type="date"
                value={form.next_payment_date}
                onChange={(event) =>
                  updateField("next_payment_date", event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-amber-200 transition focus:ring"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.is_complete}
              onChange={(event) =>
                updateField("is_complete", event.target.checked)
              }
            />
            Mark as complete
          </label>

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
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
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

    const [order, customers] = await Promise.all([
      getOrderById(orderId),
      listCustomerOptions(),
    ]);

    if (!order) {
      return { notFound: true };
    }

    return {
      props: {
        order: JSON.parse(JSON.stringify(order)),
        customers: JSON.parse(JSON.stringify(customers || [])),
      },
    };
  },
);
