# Mini App - Express & Prisma REST API Backend 🚀

A high-performance, type-safe REST API server built with **Node.js, Express, TypeScript, and Prisma ORM**. This backend powers the dynamic multi-tenant online store platform, handling authentication, tenant catalog management, order processing, and image storage.

---

## 🛠️ Technology Stack

- **Core**: Node.js, Express.js (v4.21), TypeScript (v5)
- **Database & ORM**: Prisma ORM (v5.22) with relational DB support
- **Security & Auth**: JSON Web Tokens (JWT), bcryptjs, Helmet, CORS
- **Media Storage**: Cloudinary SDK for secure, scalable server-side image upload
- **Validation**: Zod schema validation
- **Utilities**: Axios, dotenv, morgan

---

## 📦 Features

- **🔐 Authentication & Authorization**: Secure JWT-based registration and login with role-based access control (Store Owner vs. Super Admin).
- **🏬 Multi-Tenant Store Management**: Create and manage store catalogs, resolve custom slugs, and generate dynamic hero preview banners.
- **🛍️ Product & Inventory CRUD**: Manage product listings, categories, brands, variants, and stock quantities.
- **🖼️ Cloudinary Image Upload**: Endpoints for uploading product images and store banners directly to Cloudinary.
- **📦 Orders & Customers**: Process storefront orders, track order statuses (`PENDING`, `PAID`, `SHIPPED`, `DELIVERED`, `CANCELLED`), and manage customer records.
- **📊 Financial Tracking**: Generate and view invoices and payment histories per store.
- **🤖 Telegram Webhook Integration**: Automated order notifications sent to store owners via Telegram bots.
- **👑 Super Admin Panel API**: Platform-wide statistics, tenant monitoring, subscription management, and SaaS billing plans.

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have **Node.js 18+** installed.

### 2. Installation
Install the required project dependencies:
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root of the `/backend` directory:
```env
# Server Port
PORT=5000

# Database Connection
DATABASE_URL="your-database-connection-string"

# JWT Authentication Secret
JWT_SECRET="your-super-secret-jwt-key"

# Cloudinary Media Storage
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### 4. Database Setup
Generate the Prisma Client and sync your schema with the database:
```bash
npx prisma generate
npx prisma db push
# Optional: Seed initial data
npx prisma db seed
```

### 5. Running the Development Server
Start the Express server with live TypeScript recompilation (using `tsx` / `nodemon`):
```bash
npm run dev
```
The API server will run at: **`http://localhost:5000`**

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the development server on port 5000 |
| `npm run build` | Generates Prisma client and compiles TypeScript to `/dist` |
| `npm start` | Runs the compiled production server from `/dist/src/server.js` |
| `npx tsc --noEmit` | Type-checks the entire project without emitting files |
