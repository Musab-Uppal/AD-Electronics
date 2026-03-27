import { query } from "@/lib/db";
import { withPageAuth } from "@/lib/session";
import Head from "next/head";
import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatRs(value) {
  const amount = Number(value || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `Rs ${amount}`;
}

function createItemRow() {
  return {
    quantity: "1",
    name: "",
    price: "",
  };
}

export default function AddOrderPage({ customers }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    customer_phone: customers[0]?.phone || "",
    advance_payment: "0",
    purchase_date: today(),
    next_payment_date: "",
    is_complete: false,
  });
  const [itemRows, setItemRows] = useState([createItemRow()]);
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

  function updateItemRow(index, field, value) {
    setItemRows((previous) =>
      previous.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    );
  }

  function addItemRow() {
    setItemRows((previous) => [...previous, createItemRow()]);
  }

  function removeItemRow(index) {
    setItemRows((previous) => {
      if (previous.length === 1) {
        return previous;
      }

      return previous.filter((_, rowIndex) => rowIndex !== index);
    });
  }

  const validItemRows = useMemo(() => {
    return itemRows.filter((row) => {
      const quantity = Number(row.quantity);
      const price = Number(row.price);
      return (
        row.name.trim().length > 0 &&
        Number.isFinite(quantity) &&
        quantity > 0 &&
        row.price !== "" &&
        Number.isFinite(price) &&
        price >= 0
      );
    });
  }, [itemRows]);

  const calculatedTotal = useMemo(() => {
    const total = validItemRows.reduce(
      (sum, row) => sum + Number(row.price),
      0,
    );
    return Number(total.toFixed(2));
  }, [validItemRows]);

  const advance = Number(form.advance_payment || 0);
  const remaining = Number.isFinite(calculatedTotal - advance)
    ? calculatedTotal - advance
    : 0;

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    if (validItemRows.length === 0) {
      setIsSubmitting(false);
      toast.error("Add at least one valid item row");
      return;
    }

    const itemsText = validItemRows
      .map((row) => {
        const quantity = Math.floor(Number(row.quantity));
        const name = row.name.trim().replace(/\s+/g, " ");
        const price = Number(Number(row.price).toFixed(2));
        return `Qty: ${quantity} | Item: ${name} | Price: ${formatRs(price)}`;
      })
      .join("\n");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          items: itemsText,
          total: calculatedTotal,
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
        <title>Add Order | AD Electronics</title>
      </Head>

      <section className="mx-auto w-full max-w-3xl space-y-5 rounded-3xl border border-amber-200 bg-[linear-gradient(150deg,_#fff8eb,_#ffffff)] p-6 shadow-sm">
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

            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                Items
              </label>
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-600">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Quantity</th>
                      <th className="px-3 py-2 font-semibold">Name</th>
                      <th className="px-3 py-2 font-semibold">Price (Total)</th>
                      <th className="px-3 py-2 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itemRows.map((row, index) => (
                      <tr key={`item-row-${index}`}>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={row.quantity}
                            onChange={(event) =>
                              updateItemRow(
                                index,
                                "quantity",
                                event.target.value,
                              )
                            }
                            className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 outline-none ring-amber-200 transition focus:ring"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={row.name}
                            onChange={(event) =>
                              updateItemRow(index, "name", event.target.value)
                            }
                            placeholder="Item name"
                            className="w-full min-w-[220px] rounded-lg border border-slate-300 px-2 py-1.5 outline-none ring-amber-200 transition focus:ring"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.price}
                            onChange={(event) =>
                              updateItemRow(index, "price", event.target.value)
                            }
                            placeholder="0.00"
                            className="w-36 rounded-lg border border-slate-300 px-2 py-1.5 outline-none ring-amber-200 transition focus:ring"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => removeItemRow(index)}
                            disabled={itemRows.length === 1}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={addItemRow}
                  className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
                >
                  Add Item
                </button>
                <p className="text-sm font-semibold text-slate-800">
                  Order Total: {formatRs(calculatedTotal)}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
              Remaining Balance: {formatRs(remaining)}
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
                className="rounded-xl bg-[linear-gradient(135deg,_#f59e0b,_#d97706)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
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
