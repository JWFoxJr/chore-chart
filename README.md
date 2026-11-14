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
│   ├── web/        # React + Vite frontend
│   └── api/        # Node + TS API server
│       └── prisma/ # Prisma schema, migrations, seed
├── package.json
└── README.md
```
> The API owns the database. The frontend never touches SQLite directly.

---
### 🚀 Getting Started

**Prerequisites**
- Git
- fnm, initialised in your shell
- Node and npm: use the Node version recorded in `.nvmrc`

Run the following commands from the repository root.

**1. Select Node and install dependencies**

```sh
fnm install
fnm use
npm ci
```

Use `npm ci` for an existing checkout. Keep `package-lock.json` tracked;
do not delete it to resolve installation errors.

**2. Configure the environment**

For a fresh checkout:

```sh
cp apps/api/.env.example apps/api/.env
```

Do not overwrite an existing environment file. The example configures a
local SQLite development database. Environment files and databases are
not committed to Git.

**3. Prepare the database**

```sh
npm run setup
```

This generates Prisma Client and applies committed migrations.
It does not reset the database or insert sample data.
It can be run again when the database is already prepared.

For an existing server, configure the intended database and arrange a
backup before applying migrations.

**4. Start development**

```sh
npm run dev
```

Default addresses:
- Frontend: `http://localhost:5173`
- API: `http://localhost:8787`

In another terminal, verify database connectivity:

```sh
curl http://localhost:8787/health/db
```

A fresh database should return `{"db":"ok","users":0}`.

**Optional sample data — destructive**

The seed script deletes existing application records before inserting
sample data. Run it only against a disposable development database:

```sh
npm -w apps/api run prisma:seed
```

Seeding is intentionally not part of setup.

---
### 🧬 Prisma

Paths relative to the repository root:

- Schema: `apps/api/prisma/schema.prisma`
- Configuration: `apps/api/prisma.config.ts`
- Migrations: `apps/api/prisma/migrations/`
- Seed script: `apps/api/prisma/seed.ts`

Run these commands from the repository root:

```sh
# Generate Prisma Client
npm run db:generate

# Apply committed migrations
npm run db:deploy

# Create and apply a new migration during development
npm -w apps/api run prisma:migrate -- --name your_migration_name

# Open Prisma Studio
npm -w apps/api run prisma:studio
```

Use `db:deploy` when preparing a checkout or deploying committed migrations.
Use `prisma:migrate` when developing a schema change.

After changing the schema, regenerate Prisma Client:

```sh
npm run db:generate
```

---

### 🌱 Seeding

The seed script creates default users, sample chores, completions, and rewards.

**Warning: it deletes existing application records first.**
Use it only against a disposable development database.

```sh
npm -w apps/api run prisma:seed
```

Seeding is optional and is not included in `npm run setup`.

Update the seed script when schema changes require it.

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