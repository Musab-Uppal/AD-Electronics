import { query } from "@/lib/db";
import { withPageAuth } from "@/lib/session";
import Head from "next/head";
import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function AddOrderPage({ customers }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    customer_phone: customers[0]?.phone || "",
    items: "",
    total: "",
    advance_payment: "0",
    purchase_date: today(),
    next_payment_date: "",
    is_complete: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return customers;
    }

    return customers.filter((customer) => {
      return (
        customer.name.toLowerCase().includes(term) ||
        customer.phone.toLowerCase().includes(term)
      );
    });
  }, [customers, search]);

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  const total = Number(form.total || 0);
  const advance = Number(form.advance_payment || 0);
  const remaining = Number.isFinite(total - advance) ? total - advance : 0;

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          total: Number(form.total),
          advance_payment: Number(form.advance_payment || 0),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Failed to create order");
      }

      toast.success("Order created");
      await router.push(`/orders/${payload.id}`);
    } catch (error) {
      toast.error(error.message || "Could not create order");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Head>
        <title>Add Order | Installment Desk</title>
      </Head>

      <section className="mx-auto w-full max-w-3xl space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Add Order</h2>

        {customers.length === 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            No customers found. Add a customer first before creating an order.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label
                className="mb-1 block text-sm font-medium text-slate-700"
                htmlFor="customerSearch"
              >
                Search Customer
              </label>
              <input
                id="customerSearch"
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Type customer name or phone"
                className="mb-3 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-amber-200 transition focus:ring"
              />

              <label
                className="mb-1 block text-sm font-medium text-slate-700"
                htmlFor="customerPhone"
              >
                Customer
              </label>
              <select
                id="customerPhone"
                required
                value={form.customer_phone}
                onChange={(event) =>
                  updateField("customer_phone", event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-amber-200 transition focus:ring"
              >
                {filteredCustomers.map((customer) => (
                  <option key={customer.phone} value={customer.phone}>
                    {customer.name} ({customer.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="mb-1 block text-sm font-medium text-slate-700"
                htmlFor="items"
              >
                Items
              </label>
              <textarea
                id="items"
                required
                rows={4}
                value={form.items}
                onChange={(event) => updateField("items", event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-amber-200 transition focus:ring"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  className="mb-1 block text-sm font-medium text-slate-700"
                  htmlFor="total"
                >
                  Total
                </label>
                <input
                  id="total"
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.total}
                  onChange={(event) => updateField("total", event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-amber-200 transition focus:ring"
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-sm font-medium text-slate-700"
                  htmlFor="advancePayment"
                >
                  Advance Payment
                </label>
                <input
                  id="advancePayment"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.advance_payment}
                  onChange={(event) =>
                    updateField("advance_payment", event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-amber-200 transition focus:ring"
                />
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
              Remaining Balance: ${remaining.toFixed(2)}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  className="mb-1 block text-sm font-medium text-slate-700"
                  htmlFor="purchaseDate"
                >
                  Purchase Date
                </label>
                <input
                  id="purchaseDate"
                  required
                  type="date"
                  value={form.purchase_date}
                  onChange={(event) =>
                    updateField("purchase_date", event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-amber-200 transition focus:ring"
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-sm font-medium text-slate-700"
                  htmlFor="nextPaymentDate"
                >
                  Next Payment Date
                </label>
                <input
                  id="nextPaymentDate"
                  type="date"
                  value={form.next_payment_date}
                  onChange={(event) =>
                    updateField("next_payment_date", event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-amber-200 transition focus:ring"
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
              <button
                type="button"
                onClick={() => router.push("/orders")}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Saving..." : "Save Order"}
              </button>
            </div>
          </form>
        )}
      </section>
    </>
  );
}

export const getServerSideProps = withPageAuth(
  async function getServerSideProps() {
    const customers = await query(
      "SELECT phone, name FROM customers ORDER BY name ASC",
    );

    return {
      props: {
        customers,
      },
    };
  },
);
