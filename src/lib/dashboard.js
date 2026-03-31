import {
  countUpcomingOrdersInRange,
  getOutstandingTotal,
  listOverdueOrders,
  listUpcomingOrders,
} from "@/lib/db";

function formatDate(value) {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString().slice(0, 10);
}

function daysOverdue(nextPaymentDate) {
  if (!nextPaymentDate) {
    return 0;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(nextPaymentDate);
  dueDate.setHours(0, 0, 0, 0);

  const diff = today.getTime() - dueDate.getTime();
  return diff > 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) : 0;
}

function getWeekEndDate() {
  const today = new Date();
  const day = today.getDay();
  const diffToSunday = day === 0 ? 0 : 7 - day;
  const sunday = new Date(today);
  sunday.setDate(today.getDate() + diffToSunday);
  return sunday.toISOString().slice(0, 10);
}

export async function getDashboardData() {
  const today = new Date().toISOString().slice(0, 10);
  const weekEnd = getWeekEndDate();

  const [overdueRaw, upcomingRaw, totalOutstanding, upcomingThisWeekCount] =
    await Promise.all([
      listOverdueOrders(today),
      listUpcomingOrders(today),
      getOutstandingTotal(),
      countUpcomingOrdersInRange(today, weekEnd),
    ]);

  const overdue = overdueRaw.map((order) => ({
    ...order,
    next_payment_date: formatDate(order.next_payment_date),
    overdue_days: daysOverdue(order.next_payment_date),
  }));

  const upcoming = upcomingRaw.map((order) => ({
    ...order,
    next_payment_date: formatDate(order.next_payment_date),
  }));

  return {
    overdue,
    upcoming,
    stats: {
      totalOutstanding: Number(totalOutstanding || 0),
      overdueCount: overdue.length,
      upcomingThisWeekCount: Number(upcomingThisWeekCount || 0),
    },
  };
}
