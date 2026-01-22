# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the Fastify app and server entry (`app.ts`, `server.ts`) plus feature areas like `routes/`, `plugins/`, `services/`, `db/`, and `schema/`.
- `test/` contains Node test files (`*.test.ts`) grouped by area (e.g., `test/routes/`, `test/plugins/`).
- `dist/` is the compiled output from TypeScript (`tsc`), used by `start` and `dev:start`.

## Build, Test, and Development Commands
- `npm run build:ts`: Compile TypeScript into `dist/`.
- `npm run watch:ts`: Watch and rebuild TypeScript on changes.
- `npm run dev`: Build then run `watch:ts` and `dev:start` concurrently for local development.
- `npm run dev:start`: Run the compiled server from `dist/server.js`.
- `npm start`: Build then run the production server from `dist/`.
- `npm run test`: Build, type-check tests, then run Node’s test runner with coverage via `c8`.
- `npm run migrate`: Build then run DB migrations from `dist/db/migrate.js`.

## Coding Style & Naming Conventions
- Language: TypeScript, using ES module syntax.
- Indentation is 2 spaces (see `src/app.ts`).
- Linting uses ESLint with `typescript-eslint` and `eslint-config-prettier` (`eslint.config.js`).
- Tests are named `*.test.ts` and placed under `test/` (e.g., `test/routes/root.test.ts`).

## Testing Guidelines
- Framework: Node’s built-in test runner (`node --test`) with `c8` coverage.
- Run all tests with `npm run test`. Keep tests colocated under `test/` and follow the existing naming pattern.

## Commit & Pull Request Guidelines
- Commit messages in history are short, imperative, and sentence-case (e.g., `Fix cors`, `Add sleep-records routes`). Follow that style.
- Pull requests should include: a concise description, the commands run (if any), and notes on schema or API changes.

## Production Migration Policy
- This is a production project. Assume all previous migrations have already been applied.
- Never edit existing migration files. Add a new migration for any schema or data change.

## Production Migration Policy
- This is a production project. Assume all previous migrations have already been applied.
- Never edit existing migration files. Add a new migration for any schema or data change.

## Configuration & Environment
- The app uses PostgreSQL (Neon). Define `DATABASE_URL` in a root `.env` file:
  `DATABASE_URL=postgresql://user:password@host/database?sslmode=require`
- `dotenv` is included, so local development should rely on `.env` rather than hardcoded secrets.
