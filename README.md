# Zonkomi Shop 🇬🇭

Premium certified refurbished electronics e-commerce store built for the Ghanaian market.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: Prisma ORM + SQLite
- **State**: Zustand
- **Animations**: Framer Motion
- **Runtime**: Bun

## Features

- 🛒 Full shopping cart with persistent state
- 🔄 Product catalog with categories, search, and filters
- 🎡 Gamified Spin & Win wheel (unlocks at GH₵ 799+)
- 💳 Ghana payment methods (MTN MoMo, Vodafone Cash, AirtelTigo Money, Visa/MC, Cash on Delivery)
- 📦 Order management and tracking
- ⭐ Product reviews and ratings
- 👤 User accounts (register/login)
- 📱 Fully responsive design
- 🌙 14 content pages (About, Careers, Help, etc.)
- 🇬🇭 Ghana-localized (regions, phone format +233, GH₵ currency)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/zonkomi-shop.git
cd zonkomi-shop

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Push database schema
bun run db:push

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js API routes
│   ├── api/               # REST API endpoints
│   │   ├── auth/          # Authentication
│   │   ├── products/      # Product CRUD
│   │   ├── orders/        # Order management
│   │   ├── cart/          # Cart operations
│   │   ├── spin/          # Spin wheel game
│   │   └── reviews/       # Product reviews
│   └── page.tsx           # Main entry (SPA router)
├── components/
│   ├── layout/            # Header, Footer
│   ├── pages/             # Page components
│   ├── ui/                # shadcn/ui components
│   └── SpinWheel.tsx      # Spin & Win game
└── lib/
    ├── store.ts           # Zustand stores
    ├── db.ts              # Prisma client
    ├── auth.ts            # JWT authentication
    └── middleware.ts      # Auth middleware
```

## Payment Methods

| Method | Status |
|--------|--------|
| MTN Mobile Money | ✅ |
| Vodafone Cash | ✅ |
| AirtelTigo Money | ✅ |
| Visa / Mastercard | ✅ |
| Cash on Delivery | ✅ |

## License

MIT
