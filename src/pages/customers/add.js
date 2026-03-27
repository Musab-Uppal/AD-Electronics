import { withPageAuth } from "@/lib/session";
import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import toast from "react-hot-toast";

export default function AddCustomerPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    id_card_no: "",
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

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Failed to create customer");
      }

      toast.success("Customer created");
      await router.push("/customers");
    } catch (error) {
      toast.error(error.message || "Could not save customer");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Head>
        <title>Add Customer | Installment Desk</title>
      </Head>

      <section className="mx-auto w-full max-w-2xl space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Add Customer</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="mb-1 block text-sm font-medium text-slate-700"
              htmlFor="name"
            >
              Name
            </label>
            <input
              id="name"
              required
              type="text"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-amber-200 transition focus:ring"
            />
          </div>

          <div>
            <label
              className="mb-1 block text-sm font-medium text-slate-700"
              htmlFor="phone"
            >
              Phone
            </label>
            <input
              id="phone"
              required
              type="text"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-amber-200 transition focus:ring"
            />
          </div>

          <div>
            <label
              className="mb-1 block text-sm font-medium text-slate-700"
              htmlFor="address"
            >
              Address
            </label>
            <textarea
              id="address"
              rows={3}
              value={form.address}
              onChange={(event) => updateField("address", event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-amber-200 transition focus:ring"
            />
          </div>

          <div>
            <label
              className="mb-1 block text-sm font-medium text-slate-700"
              htmlFor="idCardNo"
            >
              ID Card No
            </label>
            <input
              id="idCardNo"
              type="text"
              value={form.id_card_no}
              onChange={(event) =>
                updateField("id_card_no", event.target.value)
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-amber-200 transition focus:ring"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => router.push("/customers")}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Saving..." : "Save Customer"}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

export const getServerSideProps = withPageAuth();
