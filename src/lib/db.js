import { createClient } from "@supabase/supabase-js";

let supabaseAdmin;

const DB_CONNECTION_ERROR_CODES = new Set([
  "ECONNREFUSED",
  "ENOTFOUND",
  "ETIMEDOUT",
  "PGRST000",
  "PGRST301",
  "PGRST302",
]);

const ORDER_SELECT_FIELDS =
  "id, customer_name, customer_phone, overall_time, items, total, advance_payment, remaining_balance, purchase_date, next_payment_date, is_complete";

const ORDER_SELECT_FIELDS_LEGACY =
  "id, customer_name, customer_phone, items, total, advance_payment, remaining_balance, purchase_date, next_payment_date, is_complete";

function getRequiredEnv(name, aliases = []) {
  const candidates = [name, ...aliases];

  for (const candidate of candidates) {
    const value = process.env[candidate];
    if (value) {
      return value;
    }
  }

  const aliasMessage =
    aliases.length > 0 ? ` (aliases: ${aliases.join(", ")})` : "";
  throw new Error(
    `Missing required environment variable: ${name}${aliasMessage}`,
  );
}

function normalizeDatabaseError(error, fallbackMessage) {
  const wrapped = new Error(error?.message || fallbackMessage);
  wrapped.code = error?.code;
  wrapped.details = error?.details;
  wrapped.hint = error?.hint;
  wrapped.cause = error;
  return wrapped;
}

function throwIfSupabaseError(error, fallbackMessage) {
  if (error) {
    throw normalizeDatabaseError(error, fallbackMessage);
  }
}

function combinedErrorMessage(error) {
  return `${error?.message || ""} ${error?.cause?.message || ""}`
    .toLowerCase()
    .trim();
}

function isMissingOrdersColumnError(error, columnName) {
  const code = error?.code || error?.cause?.code;
  const message = combinedErrorMessage(error);

  return (
    code === "42703" &&
    message.includes("orders") &&
    message.includes(String(columnName || "").toLowerCase())
  );
}

function shouldFallbackToLegacyOrderSelect(error) {
  return isMissingOrdersColumnError(error, "overall_time");
}

function normalizeOverallTime(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeOrderRecord(record) {
  return {
    ...record,
    overall_time: normalizeOverallTime(record?.overall_time),
  };
}

function normalizeOrderRecords(records) {
  return (records || []).map(normalizeOrderRecord);
}

function isCreateOrderRpcSignatureMismatch(error) {
  const message = combinedErrorMessage(error);

  return (
    message.includes("create_order_with_advance") &&
    (message.includes("p_overall_time") ||
      message.includes("could not find the function"))
  );
}

export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      getRequiredEnv("SUPABASE_URL", ["SUPABASE_PROJECT_URL"]),
      getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  return supabaseAdmin;
}

export function isUniqueViolation(error) {
  return error?.code === "23505";
}

export async function pingDatabase() {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("customers")
    .select("phone", { head: true, count: "exact" })
    .limit(1);

  throwIfSupabaseError(error, "Supabase connection check failed");
}

export async function listCustomers(search = "") {
  const supabase = getSupabaseAdmin();
  const term = String(search || "").trim();

  if (!term) {
    const { data, error } = await supabase
      .from("customers")
      .select("phone, name, address, id_card_no")
      .order("name", { ascending: true });

    throwIfSupabaseError(error, "Failed to load customers");
    return data || [];
  }

  const [nameResult, phoneResult] = await Promise.all([
    supabase
      .from("customers")
      .select("phone, name, address, id_card_no")
      .ilike("name", `%${term}%`),
    supabase
      .from("customers")
      .select("phone, name, address, id_card_no")
      .ilike("phone", `%${term}%`),
  ]);

  throwIfSupabaseError(nameResult.error, "Failed to search customers");
  throwIfSupabaseError(phoneResult.error, "Failed to search customers");

  const merged = new Map();

  for (const row of [...(nameResult.data || []), ...(phoneResult.data || [])]) {
    merged.set(row.phone, row);
  }

  return Array.from(merged.values()).sort((left, right) =>
    String(left.name || "").localeCompare(String(right.name || "")),
  );
}

export async function listCustomerOptions() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("customers")
    .select("phone, name")
    .order("name", { ascending: true });

  throwIfSupabaseError(error, "Failed to load customer options");
  return data || [];
}

export async function getCustomerByPhone(phone) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("customers")
    .select("phone, name, address, id_card_no")
    .eq("phone", phone)
    .maybeSingle();

  throwIfSupabaseError(error, "Failed to load customer");
  return data || null;
}

export async function createCustomer({ phone, name, address, id_card_no }) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("customers").insert({
    phone,
    name,
    address,
    id_card_no,
  });

  throwIfSupabaseError(error, "Failed to create customer");
}

export async function updateCustomerAndOrders({
  currentPhone,
  nextPhone,
  name,
  address,
  idCardNo,
}) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.rpc("update_customer_and_orders", {
    p_current_phone: currentPhone,
    p_new_phone: nextPhone,
    p_name: name,
    p_address: address,
    p_id_card_no: idCardNo,
  });

  throwIfSupabaseError(error, "Failed to update customer");
}

export async function listOrders({ filter = "all", phone = "" } = {}) {
  const supabase = getSupabaseAdmin();

  const buildQuery = (selectFields) => {
    let builder = supabase
      .from("orders")
      .select(selectFields)
      .order("purchase_date", { ascending: false })
      .order("id", { ascending: false });

    if (filter === "pending") {
      builder = builder.eq("is_complete", false);
    }

    if (filter === "complete") {
      builder = builder.eq("is_complete", true);
    }

    if (phone) {
      builder = builder.eq("customer_phone", phone);
    }

    return builder;
  };

  let { data, error } = await buildQuery(ORDER_SELECT_FIELDS);

  if (shouldFallbackToLegacyOrderSelect(error)) {
    ({ data, error } = await buildQuery(ORDER_SELECT_FIELDS_LEGACY));
  }

  throwIfSupabaseError(error, "Failed to load orders");
  return normalizeOrderRecords(data);
}

export async function listOrdersByCustomerPhone(phone) {
  const supabase = getSupabaseAdmin();

  const buildQuery = (selectFields) =>
    supabase
      .from("orders")
      .select(selectFields)
      .eq("customer_phone", phone)
      .order("purchase_date", { ascending: false })
      .order("id", { ascending: false });

  let { data, error } = await buildQuery(ORDER_SELECT_FIELDS);

  if (shouldFallbackToLegacyOrderSelect(error)) {
    ({ data, error } = await buildQuery(ORDER_SELECT_FIELDS_LEGACY));
  }

  throwIfSupabaseError(error, "Failed to load customer orders");
  return normalizeOrderRecords(data);
}

export async function getOrderById(id) {
  const supabase = getSupabaseAdmin();

  const buildQuery = (selectFields) =>
    supabase.from("orders").select(selectFields).eq("id", id).maybeSingle();

  let { data, error } = await buildQuery(ORDER_SELECT_FIELDS);

  if (shouldFallbackToLegacyOrderSelect(error)) {
    ({ data, error } = await buildQuery(ORDER_SELECT_FIELDS_LEGACY));
  }

  throwIfSupabaseError(error, "Failed to load order");
  return data ? normalizeOrderRecord(data) : null;
}

export async function listOrderPayments(orderId) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("order_payments")
    .select("id, amount, payment_date, payment_source")
    .eq("order_id", orderId)
    .order("payment_date", { ascending: true })
    .order("id", { ascending: true });

  throwIfSupabaseError(error, "Failed to load order payments");
  return data || [];
}

export async function createOrderWithAdvance({
  customerPhone,
  overallTime,
  items,
  total,
  advancePayment,
  purchaseDate,
  nextPaymentDate,
  isComplete,
}) {
  const supabase = getSupabaseAdmin();
  let { data, error } = await supabase.rpc("create_order_with_advance", {
    p_customer_phone: customerPhone,
    p_overall_time: overallTime,
    p_items: items,
    p_total: total,
    p_advance_payment: advancePayment,
    p_purchase_date: purchaseDate,
    p_next_payment_date: nextPaymentDate,
    p_is_complete: isComplete,
  });

  if (isCreateOrderRpcSignatureMismatch(error)) {
    ({ data, error } = await supabase.rpc("create_order_with_advance", {
      p_customer_phone: customerPhone,
      p_items: items,
      p_total: total,
      p_advance_payment: advancePayment,
      p_purchase_date: purchaseDate,
      p_next_payment_date: nextPaymentDate,
      p_is_complete: isComplete,
    }));
  }

  throwIfSupabaseError(error, "Failed to create order");
  return Number(data);
}

export async function updateOrderById({
  id,
  customerPhone,
  customerName,
  overallTime,
  items,
  purchaseDate,
  nextPaymentDate,
  isComplete,
}) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .update({
      customer_phone: customerPhone,
      customer_name: customerName,
      overall_time: overallTime,
      items,
      purchase_date: purchaseDate,
      next_payment_date: nextPaymentDate,
      is_complete: isComplete,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  throwIfSupabaseError(error, "Failed to update order");
  return data ? Number(data.id) : null;
}

export async function applyOrderPayment({ id, amount, nextPaymentDate }) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("apply_order_payment", {
    p_order_id: id,
    p_amount: amount,
    p_next_payment_date: nextPaymentDate,
  });

  throwIfSupabaseError(error, "Failed to apply payment");
  const result = Array.isArray(data) ? data[0] : data;

  return {
    remaining_balance: Number(result?.remaining_balance || 0),
    is_complete: Boolean(result?.is_complete),
  };
}

export async function listOverdueOrders(today) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, customer_name, customer_phone, items, remaining_balance, next_payment_date",
    )
    .eq("is_complete", false)
    .not("next_payment_date", "is", null)
    .lt("next_payment_date", today)
    .order("next_payment_date", { ascending: true });

  throwIfSupabaseError(error, "Failed to load overdue orders");
  return data || [];
}

export async function listUpcomingOrders(today) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, customer_name, customer_phone, items, remaining_balance, next_payment_date",
    )
    .eq("is_complete", false)
    .not("next_payment_date", "is", null)
    .gte("next_payment_date", today)
    .order("next_payment_date", { ascending: true });

  throwIfSupabaseError(error, "Failed to load upcoming orders");
  return data || [];
}

export async function getOutstandingTotal() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("remaining_balance")
    .eq("is_complete", false);

  throwIfSupabaseError(error, "Failed to load outstanding totals");

  return (data || []).reduce(
    (sum, row) => sum + Number(row.remaining_balance || 0),
    0,
  );
}

export async function countUpcomingOrdersInRange(startDate, endDate) {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("is_complete", false)
    .not("next_payment_date", "is", null)
    .gte("next_payment_date", startDate)
    .lte("next_payment_date", endDate);

  throwIfSupabaseError(error, "Failed to count upcoming orders");
  return Number(count || 0);
}

export function isDatabaseConnectionError(error) {
  const code = error?.code || error?.cause?.code;

  if (code && DB_CONNECTION_ERROR_CODES.has(code)) {
    return true;
  }

  const message = `${error?.message || ""} ${error?.cause?.message || ""}`
    .toLowerCase()
    .trim();

  return (
    message.includes("failed to fetch") ||
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("connection") ||
    message.includes("timed out")
  );
}

export function getDatabaseConnectionHelpMessage() {
  return "Cannot connect to Supabase. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, and ensure the Supabase project schema is initialized.";
}

export async function ensureTables() {
  // Kept for backwards compatibility; Supabase schema must be provisioned via SQL script.
  return undefined;
}

export async function query() {
  throw new Error(
    "Raw SQL queries are not supported in this build. Use Supabase helper methods from src/lib/db.js.",
  );
}
