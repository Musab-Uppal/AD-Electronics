# Installment and Order Management System

Full-stack Next.js (Pages Router) application for small business installment/order tracking.

## Tech Stack

- Next.js Pages Router
- MySQL via `mysql2/promise` (raw SQL, no ORM)
- Session auth via `iron-session`
- Tailwind CSS

## Features

- Secure admin login/logout with cookie session
- Dashboard with:
  - Overdue alerts
  - Upcoming payments
  - Summary stats
- Customer management:
  - List + search by name/phone
  - Add customer
- Order management:
  - List + filter (all/pending/complete)
  - Add order
  - View order details
  - Make payments (page + modal option)

## Required Environment Variables

Create/update `.env.local`:

```env
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
SESSION_SECRET=a_long_random_secret_string_32chars
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

## Database Initialization

No migration package is used.

On first run, `src/lib/db.js` automatically creates:

- `customers`
- `orders`

using `CREATE TABLE IF NOT EXISTS` queries.

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

3. Open:

`http://localhost:3000`

## API Routes

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET, POST /api/customers`
- `GET /api/customers/[phone]`
- `GET, POST /api/orders`
- `GET /api/orders/[id]`
- `POST /api/orders/[id]/payment`
- `GET /api/dashboard`

All protected API routes enforce authentication and return `401` when unauthenticated.

## cPanel Deployment (Node.js App)

This project includes a custom Node entry file: `server.js`.

1. Upload project to cPanel file manager or via Git.

2. In cPanel, open **Setup Node.js App**:
   - Create/select Node.js app
   - Set application root to this project folder
   - Set startup file to `server.js`

3. Set environment variables in cPanel (same keys as `.env.local`):
   - `DB_HOST`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
   - `SESSION_SECRET`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`

4. Open cPanel terminal in the project folder and run:

```bash
npm install
npm run build
```

5. Restart the Node.js app from cPanel.

6. Visit your domain.

### Optional Apache Proxy

An optional `.htaccess` is included for hosts that require Apache reverse proxy forwarding to the Node app port. Use it only if your hosting provider requires that setup.

## Production Notes

- Keep `SESSION_SECRET` at least 32 characters.
- Use a strong `ADMIN_PASSWORD`.
- Use HTTPS in production so secure cookies are transmitted safely.
