This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Demo Accounts

The database is seeded with the following test users. 

> **Note:** Because the seed script only populates the database and not Supabase Auth, you must manually create these users in your Supabase Auth dashboard with the password `password123` (or Sign Up with them) to log in.

### Chamber Admins
| Email | Password | Chamber | Role |
|-------|----------|---------|------|
| `admin@apexlaw.com` | `password123` | Apex Law Partners | Admin |
| `admin@justice.com` | `password123` | Justice Associates | Admin |

### Lawyers
| Email | Password | Chamber | Specialization |
|-------|----------|---------|----------------|
| `john.lawyer@apexlaw.com` | `password123` | Apex Law Partners | Corporate Law |
| `emma.counsel@apexlaw.com` | `password123` | Apex Law Partners | Intellectual Property |
| `david.partner@justice.com` | `password123` | Justice Associates | Family Law |

### Clients
| Email | Password | Description |
|-------|----------|-------------|
| `client1@example.com` | `password123` | Tech startup founder |
| `client2@example.com` | `password123` | Real estate investor |
| `client3@example.com` | `password123` | Small business owner |

## Important: Fix for Authentication

To make the demo accounts work with Supabase Auth (Sign Up/Login), you must run the following SQL script in your Supabase Dashboard **SQL Editor**. 

This script sets up a trigger to automatically "claim" the seeded data when you create the user in Supabase Auth.

1. Copy content from `scripts/03-fix-auth.sql`
2. Run it in Supabase SQL Editor
3. Now go to **Authentication** -> **Add User** (or use Sign Up in the app)
4. Create the users using the emails above (e.g., `admin@apexlaw.com` with `password123`).
5. The system will automatically link the new Auth User to the existing seeded data!

## Important: Fix for New User Sign Up (Row Security Error)

If you see "new row violates row-level security policy", it means the database is blocking your sign up.

1. Copy content from `scripts/05-force-fix-rls.sql` (Use this newer one)
2. Run it in Supabase SQL Editor

This script resets the security policies to properly allow you to create your account.

