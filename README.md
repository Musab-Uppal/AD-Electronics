# AD Electronics Installment and Order Management System

Full-stack Next.js (Pages Router) application for small business installment/order tracking.

## Tech Stack

- Next.js Pages Router
- Supabase (PostgreSQL + Supabase JS client)
- Session auth via iron-session
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
  - Edit customer details
- Order management:
  - List + filter (all/pending/complete)
  - Add order
  - View order details
  - Make payments (page + modal option)

## Required Environment Variables

Create or update .env.local:

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
SESSION_SECRET=replace_with_long_random_string_32_chars_min
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change_me
```

Notes:

- The app can also read SUPABASE_PROJECT_URL as a fallback alias for SUPABASE_URL.
- Never expose SUPABASE_SERVICE_ROLE_KEY in client-side code.

## Database Setup (Supabase)

1. Open your Supabase dashboard.
2. Go to SQL Editor.
3. Run the SQL script in supabase/schema.sql.

This creates:

- customers
- orders
- order_payments
- helper SQL functions used by API routes:
  - update_customer_and_orders
  - create_order_with_advance
  - apply_order_payment

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

http://localhost:3000

## API Routes

- POST /api/auth/login
- POST /api/auth/logout
- GET, POST /api/customers
- GET, PUT /api/customers/[phone]
- GET, POST /api/orders
- GET /api/orders/[id]
- POST /api/orders/[id]/payment
- GET /api/dashboard

All protected API routes enforce authentication and return 401 when unauthenticated.

## cPanel Deployment (Node.js App)

This project includes a custom Node entry file: server.js.

1. Upload project to cPanel file manager or via Git.
2. In cPanel, open Setup Node.js App:
   - Create/select Node.js app.
   - Set application root to this project folder.
   - Set startup file to server.js.
3. Set environment variables in cPanel:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - SESSION_SECRET
   - ADMIN_USERNAME
   - ADMIN_PASSWORD
4. Open cPanel terminal in the project folder and run:

```bash
npm install
npm run build
```

5. Restart the Node.js app from cPanel.
6. Visit your domain.

## Production Notes

- Keep SESSION_SECRET at least 32 characters.
- Use a strong ADMIN_PASSWORD.
- Use HTTPS in production so secure cookies are transmitted safely.
- Keep SUPABASE_SERVICE_ROLE_KEY server-side only.
