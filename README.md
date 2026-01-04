### 🧹 Chore Chart

A family-friendly chore tracking app built with:

- React + Vite + TypeScript (frontend)
- Node + TypeScript (API)
- Prisma + SQLite (data layer)

It allows parents and kids to:

- Define users and chores
- Log chore completions
- Track points over time
- Visualize activity on a calendar
- Redeem rewards (planned)

This project is also a learning exercise in:

- Modern TypeScript full-stack development
- Prisma schema and migrations
- Branch-based, issue-driven workflow
  
### 🗂 Repo Structure

```bash
/
├── apps/
│ ├── web/ # React + Vite frontend
│ ├── api/ # Node + TS API server
│ └── prisma/ # Prisma schema, migrations, seed
├── package.json
└── README.md
```
> The API owns the database. The frontend never touches SQLite directly.

---
### 🚀 Getting Started

**Prerequisites**
- Node 18+ (or whatever you're standardizing on)
- npm or pnpm
- Git

**1. Install dependencies**

From the repo root:

```bash
npm install
```

---
**2. Environment setup**

Create `.env` in the repo root (or in `apps/api` if scoped there):

`DATABASE_URL="file:./dev.db"`


> `.env` is gitignored — use `.env.example` as the template.

---
**3. Initialize the database**

From the repo root:

```bash
npx prisma migrate dev
npx prisma db seed
```

Or using scripts if defined:

```bash
npm run db:migrate
npm run db:seed
```

This will:
- Create dev.db (SQLite)
- Apply migrations
- Seed with sample users, chores, and completions

---
**4. Run the API**

`npm run dev:api`

or (depending on setup):

```bash
cd apps/api
npm run dev
```

API should be available at:

`http://localhost:3001   # or your configured port`

Health check:

`GET /health/db`

---
**5. Run the frontend**

In another terminal:

`npm run dev:web`

or:

```bash
cd apps/web
npm run dev
```

Frontend should be at:

`http://localhost:5173`

---
### 🧬 Prisma

**Schema Location**

`/prisma/schema.prisma`

**Migrations**

Located in:

`/prisma/migrations/`

**Common Commands**

```bash
# Create a new migration after schema changes
npx prisma migrate dev --name your_migration_name

# Reset DB (DANGER: deletes all data)
npx prisma migrate reset

# Seed database
npx prisma db seed

# Open Prisma Studio
npx prisma studio
```

---
### 🌱 Seeding

Seed script lives in:

`/prisma/seed.ts`

It creates:
- Default users (Mom, Dad, Son, Daughter)
- Sample chores with point values
- Sample completions for calendar/testing

Update seed data when schema changes so dev environments remain reproducible.

---
### 🧭 Development Workflow

- `main` is always stable.
- All work happens in feature branches:
  - `feat/...` for features
  - `fix/...` for bugs
  - `chore/...` for tooling/docs

**Process**

1. Create a GitHub issue
2. Create a branch from main
3. Implement the change
4. Open a PR referencing the issue (`Closes #12`)
5. Merge only when acceptance criteria are met

---
### ✅ Definition of Done

A PR is considered complete when:
- App boots locally (API + web)
- Linting and formatting pass
- Prisma migrations are committed (if schema changed)
- Seed script updated if schema changed
- README updated if developer behavior changes

---
### 📜 License

Private family project for now — no license defined yet.