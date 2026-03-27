function formatCurrency(value) {
  const amount = Number(value || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `Rs ${amount}`;
}

export default function AlertCard({ order }) {
  return (
    <article className="grain-overlay relative overflow-hidden rounded-2xl border border-red-300 bg-[linear-gradient(160deg,_#fff1f2,_#ffe4e6)] p-4 shadow-sm">
      <div className="mb-3 flex items-start gap-3">
        <div
          className="rounded-lg bg-red-600 p-2 text-white"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M12 2 1 21h22L12 2Zm1 15h-2v-2h2v2Zm0-4h-2V8h2v5Z" />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-bold text-red-900">
            {order.customer_name}
          </h3>
          <p className="text-sm text-red-700">Phone: {order.customer_phone}</p>
        </div>
      </div>

      <p className="mb-2 line-clamp-2 text-sm text-red-900">
        <span className="font-semibold">Items:</span> {order.items}
      </p>
      <p className="text-sm text-red-900">
        <span className="font-semibold">Remaining:</span>{" "}
        {formatCurrency(order.remaining_balance)}
      </p>
      <p className="text-sm text-red-900">
        <span className="font-semibold">Next payment date:</span>{" "}
        {order.next_payment_date}
      </p>
      <p className="mt-2 text-sm font-bold text-red-700">
        Overdue by {order.overdue_days} day(s)
      </p>
    </article>
  );
}
