import mysql from "mysql2/promise";

let pool;
let initPromise;

const DB_CONNECTION_ERROR_CODES = new Set([
  "ECONNREFUSED",
  "ENOTFOUND",
  "ETIMEDOUT",
  "PROTOCOL_CONNECTION_LOST",
  "ER_ACCESS_DENIED_ERROR",
  "ER_BAD_DB_ERROR",
]);

function getRequiredEnv(name) {
  const value = process.env[name];
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: getRequiredEnv("DB_HOST"),
      port: Number(process.env.DB_PORT || 3306),
      user: getRequiredEnv("DB_USER"),
      password: getRequiredEnv("DB_PASSWORD"),
      database: getRequiredEnv("DB_NAME"),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      decimalNumbers: true,
    });
  }

  return pool;
}

export function isDatabaseConnectionError(error) {
  return Boolean(error?.code && DB_CONNECTION_ERROR_CODES.has(error.code));
}

export function getDatabaseConnectionHelpMessage() {
  return "Cannot connect to MySQL. Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, and ensure your MySQL server is running.";
}

export async function pingDatabase() {
  const db = getPool();
  await db.query("SELECT 1");
}

export async function ensureTables() {
  if (initPromise) {
    await initPromise;
    return;
  }

  initPromise = (async () => {
    const db = getPool();

    await db.query(`
      CREATE TABLE IF NOT EXISTS customers (
        phone VARCHAR(20) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        address TEXT,
        id_card_no VARCHAR(50)
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_phone VARCHAR(20) NOT NULL,
        customer_name VARCHAR(100) NOT NULL,
        items TEXT NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        advance_payment DECIMAL(10,2) NOT NULL DEFAULT 0,
        remaining_balance DECIMAL(10,2) NOT NULL,
        purchase_date DATE NOT NULL,
        next_payment_date DATE,
        is_complete BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (customer_phone) REFERENCES customers(phone)
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS order_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        payment_source ENUM('advance', 'installment') NOT NULL DEFAULT 'installment',
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        INDEX idx_order_payments_order_date (order_id, payment_date)
      )
    `);

    await db.query(`
      INSERT INTO order_payments (order_id, amount, payment_date, payment_source)
      SELECT o.id, o.advance_payment, o.purchase_date, 'advance'
      FROM orders o
      LEFT JOIN order_payments p
        ON p.order_id = o.id
        AND p.payment_source = 'advance'
      WHERE o.advance_payment > 0
        AND p.id IS NULL
    `);
  })();

  try {
    await initPromise;
  } catch (error) {
    initPromise = undefined;
    throw error;
  }
}

export async function query(sql, params = []) {
  await ensureTables();
  const db = getPool();
  const [rows] = await db.query(sql, params);
  return rows;
}
