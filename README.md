# Zonkomi Shop - Premium Refurbished Electronics

A full-featured e-commerce web application built with Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui, Prisma ORM, and Zustand. Shop premium refurbished electronics at unbeatable prices with warranty and free returns.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)
![Prisma](https://img.shields.io/badge/Prisma-6-2d3748?logo=prisma)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Features

- **Homepage** - Hero banner, deal of the day, featured products, category browsing, trust badges, stats
- **Product Catalog** - Full product listing with search, filters (category, price range, condition), sorting, and pagination
- **Product Detail** - Detailed product pages with specs, reviews, quantity selector, add to cart/buy now
- **Shopping Cart** - Full cart management with quantity controls, order summary, free shipping progress bar
- **Checkout** - Multi-step checkout (shipping, payment, review) with form validation
- **Order Management** - Order history, order detail with tracking progress
- **User Authentication** - Login, registration, demo user mode
- **Account Page** - User profile, quick links to orders and cart
- **Responsive Design** - Mobile-first responsive layout with mobile hamburger menu
- **Animations** - Smooth page transitions with Framer Motion
- **State Management** - Zustand stores with localStorage persistence for cart and user

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | SQLite (via Prisma ORM) |
| State Management | Zustand |
| Animations | Framer Motion |
| Icons | Lucide React |
| Package Manager | Bun |

## Project Structure

```
zonkomi-shop/
├── prisma/
│   ├── schema.prisma          # Database schema (User, Category, Product, Cart, Order, Review)
│   └── seed.ts                # Database seeder with sample data
├── public/
│   ├── logo.svg               # Site logo
│   └── robots.txt             # SEO robots file
├── src/
│   ├── app/
│   │   ├── globals.css        # Global styles + Tailwind + custom utilities
│   │   ├── layout.tsx         # Root layout with ThemeProvider
│   │   ├── page.tsx           # SPA-style routing with page components
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── demo/route.ts      # Demo user auto-login
│   │       │   ├── login/route.ts     # User login by email
│   │       │   └── register/route.ts  # User registration
│   │       ├── cart/route.ts          # Cart CRUD
│   │       ├── categories/route.ts    # Category listing
│   │       ├── orders/
│   │       │   ├── route.ts           # Order listing & creation
│   │       │   └── [orderNumber]/route.ts  # Order detail
│   │       └── products/
│   │           ├── route.ts           # Product listing with filters
│   │           └── [slug]/route.ts    # Product detail by slug/ID
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx     # Top nav, search, cart, user menu
│   │   │   └── Footer.tsx     # Footer with links and info
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── ProductListPage.tsx
│   │   │   ├── ProductDetailPage.tsx
│   │   │   ├── CartPage.tsx
│   │   │   ├── CheckoutPage.tsx
│   │   │   ├── OrderConfirmationPage.tsx
│   │   │   ├── OrderHistoryPage.tsx
│   │   │   ├── OrderDetailPage.tsx
│   │   │   ├── AccountPage.tsx
│   │   │   └── LoginPage.tsx
│   │   └── ui/                # shadcn/ui components + custom components
│   │       ├── ProductCard.tsx
│   │       ├── StarRating.tsx
│   │       └── ...
│   ├── hooks/
│   │   ├── use-mobile.ts
│   │   └── use-toast.ts
│   └── lib/
│       ├── db.ts              # Prisma client singleton
│       ├── store.ts           # Zustand stores (App, Cart, User)
│       └── utils.ts           # cn() utility
├── .env.example               # Environment variables template
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── postcss.config.mjs
├── components.json            # shadcn/ui configuration
└── package.json
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- Git

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/zonkomi-shop.git
cd zonkomi-shop
```

2. **Install dependencies**

```bash
bun install
```

3. **Set up environment variables**

```bash
cp .env.example .env
```

4. **Initialize the database**

```bash
# Create the db directory
mkdir -p db

# Push schema to database
bun run db:push

# Generate Prisma client
bun run db:generate
```

5. **Seed the database (optional)**

```bash
bun run prisma/seed.ts
```

6. **Start the development server**

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Production Build

```bash
bun run build
bun run start
```

## Database Models

| Model | Description |
|-------|-------------|
| **User** | Customer accounts with name, email, address |
| **Category** | Product categories with sort order |
| **Product** | Products with pricing, condition, specs, stock |
| **CartItem** | User shopping cart items |
| **Order** | Orders with shipping, payment, and status tracking |
| **OrderItem** | Individual items within an order |
| **Review** | Product reviews with ratings |

## Currency

The application uses **Ghanaian Cedi (GH₵)** as the default currency.

## Color Scheme

- **Primary Green:** `#004D2E` (header, navigation)
- **Accent Gold:** `#FCD116` (CTAs, highlights)
- **Accent Red:** `#CE1126` (category bar, deals)
- **Dark Green:** `#002B1B` (top bar, footer)

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server on port 3000 |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Push Prisma schema to database |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:migrate` | Run database migrations |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List all categories with product counts |
| GET | `/api/products` | List products (with filters, sort, pagination) |
| GET | `/api/products/:slug` | Get product detail by slug or ID |
| GET | `/api/cart?userId=` | Get user's cart |
| POST | `/api/cart` | Add item to cart |
| DELETE | `/api/cart` | Remove cart item |
| GET | `/api/orders?userId=` | Get user's orders |
| POST | `/api/orders` | Create new order |
| GET | `/api/orders/:orderNumber` | Get order detail |
| POST | `/api/auth/login` | Login by email |
| POST | `/api/auth/register` | Register new user |
| GET | `/api/auth/demo` | Auto-login as demo user |

## License

MIT License - feel free to use this project for personal or commercial purposes.
