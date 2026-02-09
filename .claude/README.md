# Claude Code Project Configuration

This directory contains project-level Claude Code configuration that is automatically loaded for anyone using Claude Code in this repo.

## What's Included

### Custom Agents (`agents/`)

| Agent | Invocation | Purpose |
|-------|-----------|---------|
| `port-lovable` | `/agent port-lovable` | Enforced 6-phase process for porting Lovable/Supabase SPAs into the monorepo |

### Project Instructions (`../CLAUDE.md`)

Loaded automatically every session. Includes architecture rules, conventions, and the Supabase-to-monorepo porting guide.

## For Developers

### Prerequisites

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed
- Repository cloned locally

### Using the Porting Agent

1. Open Claude Code in the repo root:
   ```bash
   claude
   ```

2. Invoke the porting agent:
   ```
   /agent port-lovable
   ```

3. Point it at the Lovable source and follow the 6-phase process.

### Using the Scaffold Script

Generate all 8 boilerplate files for a new domain:

```bash
./scripts/scaffold-domain.sh <domain_name>

# Examples:
./scripts/scaffold-domain.sh reports
./scripts/scaffold-domain.sh billing_invoices
```

The script prints manual registration steps after generating files.

## No Installation Required

Everything in `.claude/` and `CLAUDE.md` is automatically picked up by Claude Code when working in this repository. Just `git pull` and you're set.
