# Smart Financial Management System

A modern, full-stack financial management dashboard built with React, Tailwind CSS, and Supabase.

## 🚀 Features

- **Secure Authentication**: Supabase Auth integration for secure login and registration.
- **Interactive Dashboard**: Real-time financial summaries with dynamic charts.
- **Income & Expense Tracking**: Full CRUD operations for managing all your transactions.
- **Budget Monitoring**: Set monthly category limits with visual progress bars and alerts.
- **Savings Goals**: Plan and track your financial milestones.
- **Advanced Analytics**: Detailed reports on spending habits and monthly trends.
- **Rich UI**: Premium aesthetics with glassmorphism, smooth transitions, and responsive design.

## 🛠️ Technology Stack

- **Frontend**: React.js, React Router, Tailwind CSS 4, Recharts, Lucide React, Framer Motion.
- **Backend/Database**: Supabase (PostgreSQL), Supabase Auth.

## 🏁 Getting Started

### 1. Prerequisites
- Node.js installed on your machine.
- A [Supabase](https://supabase.com) account.

### 2. Database Setup
1. Create a new project in Supabase.
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Copy the contents of `supabase_schema.sql` (found in the root of this project) and run it. This will create all necessary tables and security policies.

### 3. Environment Configuration
1. Create a `.env` file in the root directory (one has been provided as a template).
2. Add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   *You can find these in Supabase under Project Settings > API.*

### 4. Installation & Local Development
```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

## 🔐 Security
The application uses **Row Level Security (RLS)** in PostgreSQL. Each user can only see, create, update, or delete their own data. Policies are automatically applied via the `supabase_schema.sql` script.

---
Created with ❤️ for Smart Financial Management.
