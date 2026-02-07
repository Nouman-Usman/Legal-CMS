# ⚖️ Apna Waqeel: Enterprise Legal CMS

Apna Waqeel is a comprehensive, enterprise-grade Legal Case Management System (CMS) designed to bridge the gap between clients and legal professionals. Built with a modern, high-performance tech stack, it provides specialized dashboards for Chamber Administrators, Lawyers, and Clients to streamline legal operations, communication, and document management.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)](https://supabase.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io/)

---

## 🚀 Key Modules & Features

### 🏛️ Chamber Administration
*   **Centralized Oversight**: Manage multiple lawyers and legal teams from a single interface.
*   **Audit Logging**: Full traceability of actions within the chamber for security and accountability.
*   **Lead Management**: Track and convert potential clients into cases.
*   **Resource Scheduling**: Unified calendar for hearing dates, meetings, and deadlines.
*   **Analytics Dashboard**: Visual insights into chamber performance and case outcomes using Recharts.

### 💼 Lawyer Portal
*   **Case Lifecycle Management**: End-to-end tracking of legal proceedings and court hearings.
*   **Integrated Messaging**: Secure, real-time communication channels with clients and chamber peers.
*   **Document Versioning**: Comprehensive version control for legal filings, contracts, and evidence.
*   **Real-time Notifications**: Instant updates via Supabase Realtime for critical case changes.

### 👤 Client Experience
*   **Lawyer Discovery**: Specialized search to find and connect with the right legal expertise.
*   **Interactive Case Tracking**: Transparent, real-time views of legal proceedings and milestones.
*   **Secure Document Vault**: Centralized access to all case-related documents with version history.
*   **Instant Connectivity**: Direct messaging line to legal counsel.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | [Next.js 15+](https://nextjs.org/) (App Router), [React 19](https://react.dev/) |
| **Styling** | [Tailwind CSS 4.0](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/), [Lucide Icons](https://lucide.dev/) |
| **Backend & Auth** | [Supabase](https://supabase.com/) (Postgres + Auth + Realtime) |
| **ORM** | [Prisma](https://www.prisma.io/) |
| **Data Validation** | [Zod](https://zod.dev/), [React Hook Form](https://react-hook-form.com/) |
| **Visualizations** | [Recharts](https://recharts.org/) |
| **PDF Solutions** | [jsPDF](https://github.com/parallax/jsPDF), [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) |

---

## 🏁 Getting Started

### Prerequisites
*   **Node.js**: v18.0.0 or higher
*   **Supabase**: An active project with Database and Auth enabled

### Installation
1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-org/apna-waqeel.git
    cd apna-waqeel
    ```
2.  **Install dependencies**
    ```bash
    npm install
    ```
3.  **Environment Setup**
    Copy `.env.example` to `.env` and configure your keys.
    ```bash
    cp .env.example .env
    ```
4.  **Database Synchronization**
    ```bash
    npx prisma generate
    npx prisma db push
    ```

### Running Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧪 Development & Testing

### 🛠️ Common Troubleshooting

**RLS (Row-Level Security) Errors**
If you encounter "403 Forbidden" or security violations during registration:
1.  Execute `scripts/05-force-fix-rls.sql` in the Supabase SQL Editor.
2.  This resets policies to ensure proper new user onboarding.

---

## 📁 Project Architecture

```text
├── app/                  # Next.js App Router (Dashboard, API, Auth)
├── components/           # UI Component library (Radix + Custom)
├── hooks/                # Specialized React lifecycle hooks
├── lib/                  # Backend utilities and shared services
├── prisma/               # Database schema and client generation
├── public/               # Static assets and service workers
└── scripts/              # Infrastructure and database utility scripts
```

---

## 🤝 Contributing
We welcome contributions to Apna Waqeel! Whether it's a bug fix, a new feature, or documentation improvements:

1.  Fork the repo and create your branch from `main`.
2.  Follow the existing code style and linting rules.
3.  Submit a pull request with a detailed description of your changes.

---

## ⚖️ License
This project is currently for internal/demonstration purposes. Refer to the project owners for licensing details.

---
*Developed with excellence by the Apna Waqeel Team.*
