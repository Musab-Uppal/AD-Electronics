import { useState } from "react";
import toast from "react-hot-toast";

function formatRs(value) {
  const amount = Number(value || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `Rs ${amount}`;
}

export default function PaymentModal({
  orderId,
  currentRemaining,
  initialDate,
  onClose,
  onSuccess,
}) {
  const [amount, setAmount] = useState("");
  const [nextPaymentDate, setNextPaymentDate] = useState(initialDate || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/orders/${orderId}/payment`, {
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
      onSuccess?.(payload);
    } catch (error) {
      toast.error(error.message || "Could not record payment");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-[linear-gradient(160deg,_#fff9ee,_#ffffff)] p-6 shadow-xl">
        <h2 className="text-xl font-bold text-slate-900">Make Payment</h2>
        <p className="mt-1 text-sm text-slate-600">
          Current remaining balance: {formatRs(currentRemaining)}
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-slate-700"
              htmlFor="paymentAmount"
            >
              Amount
            </label>
            <input
              id="paymentAmount"
              type="number"
              step="0.01"
              min="0"
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-amber-200 transition focus:ring"
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
              required
              value={nextPaymentDate}
              onChange={(event) => setNextPaymentDate(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-amber-200 transition focus:ring"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Saving..." : "Save Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
