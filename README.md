# Moss Market

Next.js, TypeScript, Next.js API routes, Tailwind CSS, and MongoDB based storefront starter.

## Included features

- Customer signup, login, logout, and session check
- Product list, product detail, search, category filter, and sorting
- Cart, test checkout flow, order history, and order detail
- Admin product management
- Admin order monitoring
- MongoDB mode with local fallback storage for development resilience

## Requirement checklist

- Product image display: complete
- Simple product registration: complete
- Price display: complete
- Add to cart: complete
- Sign up: complete
- Login: complete
- Logout: complete
- Purchase page: complete
- Purchase history: complete
- Vercel free-tier deployment target: prepared

## Stack

- Frontend: Next.js App Router + TypeScript
- Backend: Next.js Route Handlers
- Database: MongoDB
- Styling: Tailwind CSS
- Auth: NextAuth credentials flow with MongoDB/local fallback user lookup
- Deployment target: Vercel

## Environment variables

Create `.env.local` in the project root:

```env
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-long-random-secret
AUTH_SECRET=optional-nextauth-secret
```

## Install and run

```bash
npm install
npm run dev
```

Open:

- `http://localhost:3000/`
- `http://localhost:3000/auth?type=sign-up`
- `http://localhost:3000/auth?type=login`
- `http://localhost:3000/health`

## Main routes

- `/` shop home
- `/products/[id]` product detail
- `/cart` cart
- `/orders` my orders
- `/orders/[id]` order detail
- `/admin/products` admin products
- `/admin/orders` admin orders
- `/health` deployment and MongoDB health check

## MongoDB fallback mode

If MongoDB is temporarily unavailable, the app can fall back to local JSON files in the `data/` directory for:

- users
- products
- carts
- orders

This helps development continue while Atlas or network connectivity is unstable.

## Suggested branch flow

- `main`: deploy-ready branch
- `develop`: integration branch
- `feature/auth-flow`: auth-related work
- `feature/cart-orders`: cart, checkout, order, and admin flow

## Deployment

Deploy to Vercel after setting:

- `MONGODB_URI`
- `JWT_SECRET`

Recommended deploy flow:

1. Push the project to GitHub
2. Import the repo into Vercel
3. Add `MONGODB_URI` and `JWT_SECRET` in Vercel project settings
4. Allow Vercel access in MongoDB Atlas network settings
5. Open `/health` after deployment and confirm the database check passes

If you use MongoDB Atlas, also confirm:

- database user is valid
- network access allows your deployment environment
- your connection string includes the target database name
