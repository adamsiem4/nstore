@AGENTS.md

# Claude Code Instructions

## Git

Never stage, commit, push, merge, rebase, or create PRs.
Only edit files and inspect Git state.
The user handles all Git write operations manually.

## Workflow

Before implementing a non-trivial change:

1. Inspect the existing code.
2. Check `package.json` for installed versions.
3. Read relevant Next.js documentation from `node_modules/next/dist/docs/`.
4. Understand existing project conventions.
5. Make the smallest coherent change.
6. Verify the result.

Do not assume Next.js APIs from memory.

Do not start large refactors unless they are required.

## Development

Use Bun exclusively.

Prefer editing existing files over creating unnecessary abstractions.

Do not install a dependency when the existing stack can reasonably solve the problem.

If adding a dependency, ensure it has a clear purpose in NStore.

## Next.js

Prefer Server Components.

Keep `"use client"` boundaries small.

Keep:

- database access
- secrets
- Stripe server logic
- authorization
- business logic

on the server.

Use Route Handlers only where an HTTP endpoint is actually needed, such as webhooks.

## Implementation

Before creating new functionality, search the existing project for:

- reusable components
- utilities
- types
- database queries
- existing patterns

Follow existing conventions where possible.

Avoid duplicate implementations.

## Verification

After relevant changes run:

```bash
bun run lint
bunx tsc --noEmit
bun run build
```
