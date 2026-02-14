# NutriTrack 🥗

Your personal health and nutrition companion — track calories, macronutrients, and weight with personalized goals and progress insights.

## Features

- **Calorie & Macro Tracking** — Log meals with detailed nutritional breakdowns (protein, carbs, fat)
- **Food Database** — Browse and search from a library of foods, or create your own custom entries
- **Meal Logging** — Organize intake by meal type (breakfast, lunch, dinner, snack)
- **Weight Tracker** — Record weight over time and visualize trends with charts
- **Personalized Goals** — Get calorie and macro targets based on your profile, activity level, and goals (lose, maintain, or gain)
- **Favorites** — Save frequently eaten foods for quick access
- **Onboarding Flow** — Guided setup to calculate your daily targets
- **Responsive Design** — Works seamlessly on desktop and mobile

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **UI Components:** shadcn/ui, Radix UI
- **Backend & Auth:** Supabase (PostgreSQL, Auth, Row Level Security)
- **State Management:** TanStack React Query
- **Charts:** Recharts
- **Routing:** React Router
- **Form Handling:** React Hook Form + Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A Supabase project (for database and authentication)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd nutritrack

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your Supabase URL and anon key to .env

# Start the dev server
npm run dev
```

### Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon/public key |

## Project Structure

```
src/
├── components/       # Reusable UI components
│   └── ui/           # shadcn/ui primitives
├── contexts/         # React context providers (Auth)
├── hooks/            # Custom hooks (foods, meals, weight, profile)
├── integrations/     # Supabase client & types
├── lib/              # Utilities & nutrition calculator
├── pages/            # Route pages
└── types/            # TypeScript type definitions
```

## Deployment

The app is configured for deployment on Vercel with SPA routing support via `vercel.json`.

```bash
# Build for production
npm run build
```

## License

MIT
