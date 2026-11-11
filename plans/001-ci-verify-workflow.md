# Plan 001: Every pull request is linted, type-checked and tested in CI

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat a89aea0..HEAD -- .github/workflows package.json tests/server/queries README.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `a89aea0`, 2026-11-11

## Why this matters

The only GitHub Actions workflow runs `bun audit`. Lint, the TypeScript check and
the test suite never gate a pull request, so the weekly Dependabot PRs (four were
merged in the last 30 commits) and every feature branch merge unverified. The
test suite also cannot run on a machine without database credentials: 4 of its 22
tests read a seeded Neon database and fail without `DATABASE_URL`. After this
plan, a `CI` workflow runs lint, typecheck and tests on every PR and on pushes to
`master`, and the 4 database tests skip (instead of failing) when no database is
configured.

## Current state

- `.github/workflows/dependency-security.yml` — the only workflow; runs `bun audit`. Its conventions are the ones to copy: actions pinned to full commit SHAs with a version comment, `permissions: contents: read`, `persist-credentials: false`, Bun version read from `package.json`:

  ```yaml
  permissions:
    contents: read

  jobs:
    audit:
      name: bun audit
      runs-on: ubuntu-latest
      timeout-minutes: 5
      steps:
        - name: Check out repository
          uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
          with:
            persist-credentials: false

        - name: Set up Bun
          uses: oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6 # v2.2.0
          with:
            bun-version-file: "package.json"
  ```

- `package.json:6-16` — scripts. There is no `typecheck` script; the documented check is `bunx tsc --noEmit`:

  ```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "bun test --isolate --conditions=react-server --env-file=.env.local",
  ```

- `tests/server/queries/products.test.ts` (1 test) and `tests/server/queries/product-details.test.ts` (3 tests) — the only tests that touch the database. Both start with:

  ```ts
  // ponytail: needs DATABASE_URL and a seeded database (`bun run db:migrate && bun run db:seed`)
  import assert from "node:assert/strict";
  import { test } from "bun:test";
  ```

- `.node-version` contains `24.22.1`; `package.json` pins `"packageManager": "bun@1.4.4"`. The default branch is `master`.
- `next-env.d.ts` and `.next/` are git-ignored, and the code uses Next's generated global types (`PageProps<"/orders/[id]">`, `LayoutProps<"/">`). On a fresh clone `tsc --noEmit` therefore needs `next typegen` to run first.

Facts verified by the advisor in a fresh clone of `a89aea0` with **no** `.env.local`:

- `bun install --frozen-lockfile` → exit 0.
- `bunx next typegen` → `✓ Types generated successfully`, needs no environment variables; `bunx tsc --noEmit` then exits 0.
- `bun run lint` → exit 0.
- `bun run test` → runs fine without the `.env.local` file (Bun ignores the missing `--env-file`), result `18 pass, 4 fail`; all 4 failures are `error: DATABASE_URL is not configured` in the two files above.
- `bun run build` → **fails** with `Error: DATABASE_URL is not configured … Failed to collect page data for /products/[slug]`. That is why this plan does not add a build step (see Maintenance notes).

Repo conventions that apply (from `AGENTS.md` and the existing code):

- Bun only: `bun install`, `bun run <script>`, `bunx`. Never npm, pnpm or yarn. No new dependencies.
- This is Next.js 16.4.4, which differs from older versions (for example `src/proxy.ts` replaced `middleware.ts`). Before using a Next.js API that this plan does not spell out, read its page under `node_modules/next/dist/docs/`.
- Make the smallest coherent change; do not reformat or "tidy" neighbouring code.
- Style: 2-space indent, double quotes, semicolons, trailing commas; the `@/` import alias maps to `src/`. Comments say *why* in a line or two. Some existing comments start with `ponytail:` (a deliberate simplification) — keep them verbatim.
- Tests are `bun:test` files using `node:assert/strict`, under `tests/`, mirroring the `src/` path of the module they cover.
- `.env.local` holds real credentials. Never print it, copy it, or paste any value from it into code, logs or your report.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install (only if `node_modules` is missing) | `bun install --frozen-lockfile` | exit 0, `bun.lock` unchanged |
| Lint | `bun run lint` | exit 0, prints only `$ eslint` |
| Typecheck | `bunx tsc --noEmit` | exit 0, no output |
| All tests | `bun run test` | last lines show `0 fail` |
| One test path | `bun test --isolate --conditions=react-server <path>` | `0 fail` |
| Production build | `bun run build` | exit 0, ends with the route table |

Notes: `bun run test` and `bun run build` read `.env.local`. With it present, 4 catalog tests read the live seeded Neon database (read-only). Without it those 4 tests fail with `DATABASE_URL is not configured` (or skip, once plan 001 has landed) and `bun run build` cannot succeed — in that case run every other check and state in your report that the build was not run and why. Sentry "No auth token provided" warnings during the build are expected.

## Scope

**In scope** (the only files you should modify):
- `.github/workflows/ci.yml` (create)
- `package.json` — add one line to `scripts`, nothing else
- `tests/server/queries/products.test.ts`
- `tests/server/queries/product-details.test.ts`
- `README.md` — the two edits in Step 4 only

**Out of scope** (do NOT touch, even though they look related):
- `.github/workflows/dependency-security.yml` and `.github/dependabot.yml` — working as intended.
- `bun.lock` — adding a script must not change it. Do not run `bun install` without `--frozen-lockfile`, `bun add`, or `bun update`.
- `AGENTS.md` — it lists `bunx tsc --noEmit`; that command keeps working. The owner maintains this file.
- A `bun run build` step in CI — it needs repository secrets the executor cannot create.
- GitHub branch rulesets / required checks — owner-only, done in the GitHub UI.
- Any change to what the database tests assert.

## Git workflow

- The repository owner performs every Git write. Do NOT run `git add`, `git commit`, `git stash`, `git checkout`, `git push`, or open a PR — leave your changes in the working tree. The one exception: whoever dispatched you explicitly gave you a disposable worktree or branch and told you to commit there (then use branch `advisor/<plan-number>-<slug>`).
- Read-only Git (`git status`, `git diff`) is fine.
- History uses Conventional Commits, e.g. `fix(deps): update Sentry and remove shadcn CLI dependency`, `ci: add Dependabot updates and Bun dependency security audit`.
Suggested message: `ci: run lint, typecheck and tests on every pull request`

## Steps

### Step 1: Add a `typecheck` script

In `package.json`, add this line to `scripts` directly after the `"lint"` line:

```json
    "typecheck": "next typegen && tsc --noEmit",
```

Resulting diff:

```diff
--- a/package.json
+++ b/package.json
@@ -9,4 +9,5 @@
     "start": "next start",
     "lint": "eslint",
+    "typecheck": "next typegen && tsc --noEmit",
     "test": "bun test --isolate --conditions=react-server --env-file=.env.local",
     "db:generate": "bunx drizzle-kit generate",
```

**Verify**: `bun run typecheck` → prints `✓ Types generated successfully`, exits 0, no TypeScript errors.
**Verify**: `git status --short bun.lock` → no output.

### Step 2: Make the database tests skip without a database

Apply the same three-line change to both files: extend the header comment, import `test` under another name, and define `test` as the skipping variant. No call site changes.

`tests/server/queries/products.test.ts`:

```diff
--- a/tests/server/queries/products.test.ts
+++ b/tests/server/queries/products.test.ts
@@ -1,8 +1,11 @@
-// ponytail: needs DATABASE_URL and a seeded database (`bun run db:migrate && bun run db:seed`)
+// ponytail: needs DATABASE_URL and a seeded database (`bun run db:migrate && bun run db:seed`);
+// without one (CI, a fresh clone) it is skipped rather than failed.
 import assert from "node:assert/strict";
-import { test } from "bun:test";
+import { test as bunTest } from "bun:test";
 import { catalog } from "@/server/db/seed/products";
 import { getProduct, getProducts } from "@/server/queries/products";
 
+const test = bunTest.skipIf(!process.env.DATABASE_URL);
+
 test("seed match, lookup, retirement, and category search", async () => {
   const products = await getProducts();
```

`tests/server/queries/product-details.test.ts`:

```diff
--- a/tests/server/queries/product-details.test.ts
+++ b/tests/server/queries/product-details.test.ts
@@ -1,8 +1,11 @@
-// ponytail: needs DATABASE_URL and a seeded database (`bun run db:migrate && bun run db:seed`)
+// ponytail: needs DATABASE_URL and a seeded database (`bun run db:migrate && bun run db:seed`);
+// without one (CI, a fresh clone) these are skipped rather than failed.
 import assert from "node:assert/strict";
-import { test } from "bun:test";
+import { test as bunTest } from "bun:test";
 import { getProductDetails } from "@/server/queries/product-details";
 import { getProducts } from "@/server/queries/products";
 
+const test = bunTest.skipIf(!process.env.DATABASE_URL);
+
 // A product page renders the whole sheet, so a missing or thin one is a hole in
 // the page, not a degraded section.
```

**Verify (no database)**: `DATABASE_URL= bun test --isolate --conditions=react-server tests/server/queries` → `0 pass`, `4 skip`, `0 fail`. (The empty `DATABASE_URL=` prefix overrides the value Bun auto-loads from `.env.local`.)
**Verify (database, only if `.env.local` exists)**: `bun run test` → `0 fail`, `0 skip`.

### Step 3: Create the workflow

Create `.github/workflows/ci.yml` with exactly this content:

```yaml
name: CI

on:
  pull_request:
  push:
    branches:
      - master
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    name: verify
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Check out repository
        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false

      - name: Set up Node.js
        uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
        with:
          node-version-file: ".node-version"

      - name: Set up Bun
        uses: oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6 # v2.2.0
        with:
          bun-version-file: "package.json"

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Lint
        run: bun run lint

      - name: Typecheck
        run: bun run typecheck

      # The four catalog tests need a seeded database and skip here.
      - name: Test
        run: bun run test
```

Notes on the choices (do not change them):
- The `actions/checkout` and `oven-sh/setup-bun` SHAs are copied from the existing workflow. The `actions/setup-node` SHA is the commit the `v7.1.0` tag pointed to on 2026-11-11 (`git ls-remote --tags https://github.com/actions/setup-node`).
- Node is installed explicitly because ESLint and `next typegen` run on Node and the repo pins `24.22.1`.
- No secrets are referenced, so the job behaves the same on Dependabot and fork PRs.

**Verify**: `bun -e 'const w = Bun.YAML.parse(await Bun.file(".github/workflows/ci.yml").text()); console.log(Object.keys(w.jobs), w.jobs.verify.steps.length)'` → `[ "verify" ] 7`
**Verify**: `grep -cE "uses: [a-z/-]+@[0-9a-f]{40} # v" .github/workflows/ci.yml` → `3`

### Step 4: Document it in `README.md`

1. In the "Useful checks" code block, replace the line `bunx tsc --noEmit` with `bun run typecheck`.
2. Directly **before** the paragraph that starts ``The `Dependency Security` workflow in``, insert this paragraph followed by a blank line:

   ```markdown
   The `CI` workflow in `.github/workflows/ci.yml` runs `bun run lint`,
   `bun run typecheck`, and `bun run test` on every pull request and on pushes to
   `master`. It uses no secrets: the catalog query tests need a seeded database and
   skip when `DATABASE_URL` is unset, so run `bun run test` locally with
   `.env.local` before changing the catalog or its queries. The production build is
   not part of CI because it reads the catalog at build time. Make the `verify`
   check required in the branch ruleset after its first run.
   ```

**Verify**: `grep -c "bun run typecheck" README.md` → `2`; `grep -c "bunx tsc --noEmit" README.md` → `0`

### Step 5: Run the full gate

**Verify**: `bun run lint` → exit 0.
**Verify**: `bun run typecheck` → exit 0.
**Verify**: `bun run test` → `0 fail` (22 tests: all pass with `.env.local`; `18 pass, 4 skip` without).

## Test plan

No new tests. The behaviour change is that the 4 existing database tests skip without `DATABASE_URL`; Step 2's two commands prove both modes.

## Done criteria

- [ ] `.github/workflows/ci.yml` exists and both Step 3 verifications print the expected output
- [ ] `bun run typecheck` exits 0
- [ ] `DATABASE_URL= bun run test` prints `4 skip` and `0 fail`
- [ ] `bun run lint` exits 0
- [ ] `git status --short` lists only: `.github/workflows/ci.yml`, `package.json`, `README.md`, the two test files (and `plans/`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `bun run typecheck` reports TypeScript errors. The baseline at `a89aea0` is clean (`bunx tsc --noEmit` exits 0), so an error means the tree drifted or Step 1 was applied wrongly.
- `DATABASE_URL= bun run test` reports a failure in any file other than the two in scope — some other test has started depending on the environment.
- `bun.lock` shows up in `git status`.
- You are asked to, or feel the need to, add secrets, a build step, or a database service to the workflow.

## Maintenance notes

- **Owner action after merge**: add the `verify` check to the branch ruleset (the README already asks for `bun audit` to be required). Check names are case-sensitive.
- **Build in CI is deferred on purpose.** `next build` calls `generateStaticParams` in `src/app/(store)/products/[slug]/page.tsx`, which queries the database. To add a build job later, create a `DATABASE_URL` Actions secret pointing at a seeded, read-only Neon branch, plus the Clerk keys, and add a separate job that does not run for Dependabot/fork PRs (they receive no secrets).
- **Running the database tests in CI** uses the same secret: add `env: DATABASE_URL: ${{ secrets.DATABASE_URL }}` to the Test step; with the secret absent the tests keep skipping.
- New tests that need a real database must use the same `skipIf` pattern or they will fail CI.
- When Dependabot bumps `actions/checkout` or `oven-sh/setup-bun`, it updates both workflows; review that the SHAs stay identical across them.
