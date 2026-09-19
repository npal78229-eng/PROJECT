# Amazon Clone — Full-Stack E-Commerce Platform

A production-style Amazon Clone built with **React (Vite) + Tailwind CSS + Redux Toolkit** on the frontend, and **Node.js + Express + PostgreSQL** on the backend with **Stripe** payment processing.

---

## 🏗️ Tech Stack

| Layer | Choice | Details |
|---|---|---|
| **Frontend** | React 18, Vite, React Router v6 | Fast compilation, modern SPA routing |
| **State Management** | Redux Toolkit | Centralized cart & user auth state |
| **Styling** | Tailwind CSS | Amazon-inspired responsive design |
| **Backend** | Node.js + Express | RESTful API server with modular routers |
| **Database** | PostgreSQL | Relational schema with transactions for inventory integrity |
| **Authentication** | JWT + bcryptjs | Secure password hashing, access & refresh token flow |
| **Payments** | Stripe Elements | Secure payment intent creation & verification |

---

## 📁 Project Structure

```
amazon-clone/
├── client/                     # Frontend SPA (Vite + React)
│   ├── src/
│   │   ├── api/axios.js        # Axios instance with auth interceptor
│   │   ├── components/         # Navbar, ProductCard, etc.
│   │   ├── pages/              # Home, ProductDetail, Cart, Checkout, Login
│   │   ├── redux/              # store.js, cartSlice.js, authSlice.js
│   │   ├── App.jsx             # Main router & Stripe Elements provider
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                     # Backend API (Express + Postgres)
│   ├── src/
│   │   ├── config/db.js        # PostgreSQL pool connection
│   │   ├── middleware/auth.js  # JWT authenticate & requireRole
│   │   ├── routes/             # auth, products, cart, orders
│   │   └── index.js            # Express server entry point
│   ├── migrations/
│   │   ├── schema.sql          # Full PostgreSQL DDL schema
│   │   └── seed.sql            # Seed categories, users, and 12+ products
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## 🚀 Quick Start Instructions

### 1. Backend Setup
```powershell
cd amazon-clone/server

# Install dependencies
npm install

# Configure environment variables
# Copy .env.example to .env and set your DATABASE_URL (e.g. Neon, Supabase, or local Postgres)
Copy-Item .env.example .env

# Run database schema & seed scripts in PostgreSQL
# psql -U postgres -d amazon_clone -f migrations/schema.sql
# psql -U postgres -d amazon_clone -f migrations/seed.sql

# Start server
npm run dev
```
Backend runs at `http://localhost:5000`. Health check endpoint: `GET http://localhost:5000/`.

### 2. Frontend Setup
```powershell
cd amazon-clone/client

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Frontend runs at `http://localhost:5173`.

---

## 📡 REST API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | Public | Server health-check |
| `POST` | `/api/auth/register` | Public | Register new user (`customer` or `seller`) |
| `POST` | `/api/auth/login` | Public | Authenticate user & receive JWT tokens |
| `GET` | `/api/products` | Public | List products (supports `?q=`, `?category=`, `?minPrice=`, `?maxPrice=`, pagination) |
| `GET` | `/api/products/:id` | Public | Get product details by ID |
| `POST` | `/api/products` | Seller/Admin | Create new product listing |
| `GET` | `/api/cart` | Authenticated | Get current user's cart items |
| `POST` | `/api/cart` | Authenticated | Upsert item quantity in cart |
| `DELETE` | `/api/cart/:productId` | Authenticated | Remove product from cart |
| `POST` | `/api/orders/checkout` | Authenticated | Check stock and create Stripe PaymentIntent |
| `POST` | `/api/orders/confirm` | Authenticated | Atomic DB transaction (`BEGIN...COMMIT`): creates order & decrements stock |
| `GET` | `/api/orders/my-orders` | Authenticated | Get user's order history |

---

## 🔒 Transactional Stock Decrement

In `server/src/routes/orders.js`, order creation is wrapped in a strict SQL transaction:
```javascript
await client.query('BEGIN');
// 1. Verify stock with row locking (FOR UPDATE)
// 2. Insert into orders table
// 3. Insert into order_items table
// 4. Atomically decrement stock: UPDATE products SET stock = stock - $1 WHERE id = $2
// 5. Clear cart_items
await client.query('COMMIT');
```
This guarantees no race conditions, over-selling, or incomplete orders.
