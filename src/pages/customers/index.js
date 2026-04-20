import { listCustomers } from "@/lib/db";
import { withPageAuth } from "@/lib/session";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import toast from "react-hot-toast";

export default function CustomersPage({ customers, initialQuery }) {
  const router = useRouter();
  const [search, setSearch] = useState(initialQuery || "");
  const [customerRows, setCustomerRows] = useState(customers || []);
  const [deletingPhone, setDeletingPhone] = useState("");

  function handleSearch(event) {
    event.preventDefault();

    const trimmed = search.trim();
    if (!trimmed) {
      router.push("/customers");
      return;
    }

    router.push(`/customers?q=${encodeURIComponent(trimmed)}`);
  }

  async function handleDeleteCustomer(phone, name) {
    if (deletingPhone) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete customer \"${name}\" (${phone})? Related orders and payments will also be deleted.`,
    );

    if (!shouldDelete) {
      return;
    }

    setDeletingPhone(phone);

    try {
      const response = await fetch(
        `/api/customers/${encodeURIComponent(phone)}`,
        {
          method: "DELETE",
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Failed to delete customer");
      }

      setCustomerRows((previous) =>
        previous.filter((customer) => customer.phone !== phone),
      );
      toast.success("Customer deleted");
    } catch (error) {
      toast.error(error.message || "Could not delete customer");
    } finally {
      setDeletingPhone("");
    }
  }

  return (
    <>
      <Head>
        <title>Customers | AD Electronics</title>
      </Head>

      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-slate-900">Customers</h2>
          <Link
            href="/customers/add"
            className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
          >
            Add New Customer
          </Link>
        </div>

        <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search by name or phone"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-w-55 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-amber-200 transition focus:ring"
          />
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Search
          </button>
        </form>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Address</th>
                <th className="px-4 py-3 font-semibold">ID Card No</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {customerRows.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-4 text-center text-slate-500"
                    colSpan={5}
                  >
                    No customers found.
                  </td>
                </tr>
              ) : (
                customerRows.map((customer) => (
                  <tr key={customer.phone}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {customer.name}
                    </td>
                    <td className="px-4 py-3">{customer.phone}</td>
                    <td className="px-4 py-3">{customer.address || "-"}</td>
                    <td className="px-4 py-3">{customer.id_card_no || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/customers/${encodeURIComponent(customer.phone)}/edit`}
                          className="font-semibold text-slate-700 hover:text-slate-900"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/orders?phone=${encodeURIComponent(customer.phone)}`}
                          className="font-semibold text-amber-700 hover:text-amber-900"
                        >
                          View Orders
                        </Link>
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteCustomer(customer.phone, customer.name)
                          }
                          disabled={deletingPhone === customer.phone}
                          className="font-semibold text-rose-700 transition hover:text-rose-900 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingPhone === customer.phone
                            ? "Deleting..."
                            : "Delete"}
                        </button>
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
    const search = String(context.query.q || "").trim();
    const customers = await listCustomers(search);

    return {
      props: {
        customers,
        initialQuery: search,
      },
    };
  },
);
