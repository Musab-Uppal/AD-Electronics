import mysql from "mysql2/promise";

let pool;
let initPromise;

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: getRequiredEnv("DB_HOST"),
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
