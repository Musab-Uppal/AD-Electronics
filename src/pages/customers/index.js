import { query } from "@/lib/db";
import { withPageAuth } from "@/lib/session";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

export default function CustomersPage({ customers, initialQuery }) {
  const router = useRouter();
  const [search, setSearch] = useState(initialQuery || "");

  function handleSearch(event) {
    event.preventDefault();

    const trimmed = search.trim();
    if (!trimmed) {
      router.push("/customers");
      return;
    }

    router.push(`/customers?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <>
      <Head>
        <title>Customers | Installment Desk</title>
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
            className="min-w-[220px] flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-amber-200 transition focus:ring"
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
              {customers.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-4 text-center text-slate-500"
                    colSpan={5}
                  >
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.phone}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {customer.name}
                    </td>
                    <td className="px-4 py-3">{customer.phone}</td>
                    <td className="px-4 py-3">{customer.address || "-"}</td>
                    <td className="px-4 py-3">{customer.id_card_no || "-"}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/orders?phone=${encodeURIComponent(customer.phone)}`}
                        className="font-semibold text-amber-700 hover:text-amber-900"
                      >
                        View Orders
                      </Link>
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

    let sql = "SELECT phone, name, address, id_card_no FROM customers";
    const params = [];

    if (search) {
      sql += " WHERE name LIKE ? OR phone LIKE ?";
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += " ORDER BY name ASC";

    const customers = await query(sql, params);

    return {
      props: {
        customers,
        initialQuery: search,
      },
    };
  },
);
