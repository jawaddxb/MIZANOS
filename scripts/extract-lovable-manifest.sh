#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# extract-lovable-manifest.sh
# Scans a Lovable/Supabase SPA source directory and produces PORT_MANIFEST.md
# with an exhaustive, machine-verifiable inventory of everything to port.
#
# Usage: ./scripts/extract-lovable-manifest.sh /path/to/lovable-source
# Output: PORT_MANIFEST.md in the current directory
# ─────────────────────────────────────────────────────────────────────────────

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 /path/to/lovable-source"
  exit 1
fi

SRC_DIR="$(cd "$1" && pwd)"
OUT="PORT_MANIFEST.md"
DATE="$(date +%Y-%m-%d)"
PROJECT_NAME="$(basename "$SRC_DIR")"

if [[ ! -d "$SRC_DIR/src" ]]; then
  echo "Error: $SRC_DIR/src not found. Is this a Lovable project?"
  exit 1
fi

# ─── Temp files ──────────────────────────────────────────────────────────────
TMPDIR_MANIFEST="$(mktemp -d)"
trap 'rm -rf "$TMPDIR_MANIFEST"' EXIT

# ─── Counters ────────────────────────────────────────────────────────────────
COUNT_TABLES=0
COUNT_QUERIES=0
COUNT_EDGE_FNS=0
COUNT_AUTH=0
COUNT_PAGES=0
COUNT_COMPONENTS=0
COUNT_HOOKS=0
COUNT_RLS=0

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 1: Database Tables
# ═══════════════════════════════════════════════════════════════════════════════
extract_tables() {
  local types_file="$SRC_DIR/src/integrations/supabase/types.ts"
  local out_file="$TMPDIR_MANIFEST/tables.md"

  echo "| Table | Columns | Target Model |" > "$out_file"
  echo "|-------|---------|--------------|" >> "$out_file"

  if [[ ! -f "$types_file" ]]; then
    echo "Warning: types.ts not found at $types_file — skipping table extraction" >&2
    return
  fi

  # Extract table names from the Database interface — look for keys under Tables:
  local current_table=""
  local columns=""
  local in_row=0

  while IFS= read -r line; do
    # Match table name: indented key followed by { (e.g., "    products: {")
    if echo "$line" | grep -qE '^\s{4,6}[a-z_]+:\s*\{'; then
      # Save previous table if exists
      if [[ -n "$current_table" && -n "$columns" ]]; then
        local domain
        domain="$(echo "$current_table" | sed 's/_/-/g')"
        echo "| $current_table | $columns | apps/api/models/${current_table}.py |" >> "$out_file"
        COUNT_TABLES=$((COUNT_TABLES + 1))
      fi
      current_table="$(echo "$line" | sed 's/^[[:space:]]*//' | cut -d: -f1)"
      columns=""
      in_row=0
    fi

    # Detect Row: { block
    if echo "$line" | grep -qE '^\s+Row:\s*\{'; then
      in_row=1
      continue
    fi

    # Inside Row block, extract column names
    if [[ $in_row -eq 1 ]]; then
      if echo "$line" | grep -qE '^\s+\}'; then
        in_row=0
        continue
      fi
      local col
      col="$(echo "$line" | sed 's/^[[:space:]]*//' | cut -d: -f1 | sed 's/[[:space:]]//g')"
      if [[ -n "$col" && "$col" != "}" && "$col" != "{" ]]; then
        if [[ -n "$columns" ]]; then
          columns="$columns, $col"
        else
          columns="$col"
        fi
      fi
    fi
  done < "$types_file"

  # Save last table
  if [[ -n "$current_table" && -n "$columns" ]]; then
    echo "| $current_table | $columns | apps/api/models/${current_table}.py |" >> "$out_file"
    COUNT_TABLES=$((COUNT_TABLES + 1))
  fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 2: Supabase Queries
# ═══════════════════════════════════════════════════════════════════════════════
extract_queries() {
  local out_file="$TMPDIR_MANIFEST/queries.md"

  echo "| Source File | Table | Operation | Detail | Target |" > "$out_file"
  echo "|------------|-------|-----------|--------|--------|" >> "$out_file"

  # Find all .from() calls with context
  grep -rn '\.from(' "$SRC_DIR/src/" \
    --include="*.ts" --include="*.tsx" 2>/dev/null | \
    grep -v node_modules | grep -v '.d.ts' | \
  while IFS= read -r match; do
    local file
    file="$(echo "$match" | cut -d: -f1 | sed "s|$SRC_DIR/||")"
    local line_content
    line_content="$(echo "$match" | cut -d: -f3-)"

    # Extract table name from .from("table_name") or .from('table_name')
    local table
    table="$(echo "$line_content" | grep -oE "\.from\(['\"][a-z_]+['\"]\)" | head -1 | sed "s/.*['\"]//;s/['\"].*//")"
    [[ -z "$table" ]] && continue

    # Detect operation
    local op="select"
    echo "$line_content" | grep -q '\.insert(' && op="insert"
    echo "$line_content" | grep -q '\.update(' && op="update"
    echo "$line_content" | grep -q '\.delete(' && op="delete"
    echo "$line_content" | grep -q '\.upsert(' && op="upsert"

    # Extract select columns if present
    local detail=""
    if [[ "$op" == "select" ]]; then
      detail="$(echo "$line_content" | grep -oE "\.select\(['\"][^'\"]*['\"]\)" | head -1 | sed "s/.*['\"]//;s/['\"].*//")"
      [[ -z "$detail" ]] && detail="*"
    fi

    # Map to target
    local repo_method="getAll()"
    case "$op" in
      select) repo_method="${table}Repository.getAll()" ;;
      insert) repo_method="${table}Repository.create()" ;;
      update) repo_method="${table}Repository.update()" ;;
      delete) repo_method="${table}Repository.delete()" ;;
      upsert) repo_method="${table}Repository.create() / update()" ;;
    esac

    echo "| $file | $table | $op | $detail | $repo_method |" >> "$out_file"
    COUNT_QUERIES=$((COUNT_QUERIES + 1))
  done
}

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 3: Edge Functions
# ═══════════════════════════════════════════════════════════════════════════════
extract_edge_functions() {
  local out_file="$TMPDIR_MANIFEST/edge_functions.md"

  echo "| Function | Called From | Target Service | Target Endpoint |" > "$out_file"
  echo "|----------|-----------|----------------|-----------------|" >> "$out_file"

  # Scan supabase/functions/ directory for function names
  local fn_dir="$SRC_DIR/supabase/functions"
  if [[ -d "$fn_dir" ]]; then
    for fn_path in "$fn_dir"/*/; do
      [[ ! -d "$fn_path" ]] && continue
      local fn_name
      fn_name="$(basename "$fn_path")"
      [[ "$fn_name" == "_shared" ]] && continue

      # Find callers
      local callers
      callers="$(grep -rl "functions.invoke.*['\"]${fn_name}['\"]" "$SRC_DIR/src/" \
        --include="*.ts" --include="*.tsx" 2>/dev/null | \
        sed "s|$SRC_DIR/||" | tr '\n' ', ' | sed 's/,$//')"
      [[ -z "$callers" ]] && callers="(no frontend caller found)"

      local service_name
      service_name="$(echo "$fn_name" | sed 's/-/_/g')"
      local domain
      domain="$(echo "$fn_name" | cut -d- -f1)"

      echo "| $fn_name | $callers | ${domain}_service.${service_name}() | POST /${domain}/${fn_name} |" >> "$out_file"
      COUNT_EDGE_FNS=$((COUNT_EDGE_FNS + 1))
    done
  fi

  # Also find .functions.invoke() calls that may reference functions not in the directory
  grep -rn 'functions\.invoke(' "$SRC_DIR/src/" \
    --include="*.ts" --include="*.tsx" 2>/dev/null | \
    grep -v node_modules | \
  while IFS= read -r match; do
    local file
    file="$(echo "$match" | cut -d: -f1 | sed "s|$SRC_DIR/||")"
    local fn_name
    fn_name="$(echo "$match" | grep -oE "invoke\(['\"][a-z_-]+['\"]\)" | head -1 | sed "s/.*['\"]//;s/['\"].*//")"
    [[ -z "$fn_name" ]] && continue

    # Skip if already found in directory scan
    if [[ -d "$SRC_DIR/supabase/functions/$fn_name" ]]; then
      continue
    fi

    local service_name
    service_name="$(echo "$fn_name" | sed 's/-/_/g')"
    echo "| $fn_name | $file | (service TBD).${service_name}() | POST /.../${fn_name} |" >> "$out_file"
    COUNT_EDGE_FNS=$((COUNT_EDGE_FNS + 1))
  done
}

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 4: Auth Patterns
# ═══════════════════════════════════════════════════════════════════════════════
extract_auth() {
  local out_file="$TMPDIR_MANIFEST/auth.md"

  echo "| Pattern | Source Files | Monorepo Equivalent |" > "$out_file"
  echo "|---------|-------------|---------------------|" >> "$out_file"

  local -a auth_methods=("getUser" "getSession" "signIn" "signUp" "signOut" "onAuthStateChange" "resetPasswordForEmail" "updateUser")
  local -a monorepo_equiv=(
    "CurrentUser dependency"
    "JWT token in Authorization header"
    "POST /auth/login endpoint"
    "POST /auth/register endpoint"
    "POST /auth/logout endpoint"
    "Auth context provider + token refresh"
    "POST /auth/reset-password endpoint"
    "PUT /auth/profile endpoint"
  )

  for i in "${!auth_methods[@]}"; do
    local method="${auth_methods[$i]}"
    local equiv="${monorepo_equiv[$i]}"
    local files
    files="$(grep -rl "auth\.${method}" "$SRC_DIR/src/" \
      --include="*.ts" --include="*.tsx" 2>/dev/null | \
      sed "s|$SRC_DIR/||" | tr '\n' ', ' | sed 's/,$//')"

    if [[ -n "$files" ]]; then
      echo "| supabase.auth.${method}() | $files | $equiv |" >> "$out_file"
      COUNT_AUTH=$((COUNT_AUTH + 1))
    fi
  done
}

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 5: Page Routes
# ═══════════════════════════════════════════════════════════════════════════════
extract_routes() {
  local out_file="$TMPDIR_MANIFEST/routes.md"

  echo "| Path | Component | Protected | Target Page |" > "$out_file"
  echo "|------|-----------|-----------|-------------|" >> "$out_file"

  # Look for route definitions in App.tsx or router config
  local app_file=""
  for candidate in "$SRC_DIR/src/App.tsx" "$SRC_DIR/src/app/App.tsx" "$SRC_DIR/src/routes.tsx"; do
    [[ -f "$candidate" ]] && app_file="$candidate" && break
  done

  if [[ -z "$app_file" ]]; then
    echo "Warning: No App.tsx or routes file found — skipping route extraction" >&2
    return
  fi

  # Extract Route elements — handles <Route path="..." element={<Component />} />
  grep -n '<Route' "$app_file" 2>/dev/null | while IFS= read -r line; do
    local path
    path="$(echo "$line" | grep -oE 'path="[^"]*"' | head -1 | sed 's/path="//;s/"//')"
    [[ -z "$path" ]] && continue

    local component
    component="$(echo "$line" | grep -oE 'element=\{<[A-Za-z]+' | head -1 | sed 's/element={<//')"
    [[ -z "$component" ]] && component="(inline)"

    # Detect protection — look for ProtectedRoute wrapper or auth guards
    local protected="public"
    if echo "$line" | grep -qi "protect\|auth\|private"; then
      protected="protected"
    fi
    # Also check parent context (rough heuristic)
    local line_num
    line_num="$(echo "$line" | cut -d: -f1)"

    # Map to monorepo page path
    local page_path
    if [[ "$protected" == "protected" ]]; then
      page_path="apps/web/src/app/(app)${path}/page.tsx"
    else
      page_path="apps/web/src/app/(auth)${path}/page.tsx"
    fi
    # Clean up double slashes
    page_path="$(echo "$page_path" | sed 's|//|/|g')"

    echo "| $path | $component | $protected | $page_path |" >> "$out_file"
    COUNT_PAGES=$((COUNT_PAGES + 1))
  done
}

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 6: Components
# ═══════════════════════════════════════════════════════════════════════════════
extract_components() {
  local out_file="$TMPDIR_MANIFEST/components.md"

  echo "| Component | LOC | Supabase Deps | Target Location |" > "$out_file"
  echo "|-----------|-----|---------------|-----------------|" >> "$out_file"

  find "$SRC_DIR/src/components" -name "*.tsx" 2>/dev/null | sort | while IFS= read -r file; do
    local name
    name="$(basename "$file" .tsx)"
    local rel_path
    rel_path="$(echo "$file" | sed "s|$SRC_DIR/||")"
    local loc
    loc="$(wc -l < "$file" | tr -d ' ')"

    # Detect Supabase dependencies via imports
    local deps=""
    # Check for direct supabase imports
    if grep -q "supabase" "$file" 2>/dev/null; then
      deps="direct"
    fi
    # Check for hook imports that use supabase
    local hook_imports
    hook_imports="$(grep -oE "use[A-Z][A-Za-z]+" "$file" 2>/dev/null | sort -u | tr '\n' ', ' | sed 's/,$//')"
    if [[ -n "$hook_imports" && "$deps" != "direct" ]]; then
      # Check if any imported hook uses supabase
      for hook_name in $(echo "$hook_imports" | tr ',' '\n'); do
        local hook_file
        hook_file="$(find "$SRC_DIR/src" -name "*.ts" -name "*.tsx" 2>/dev/null | xargs grep -l "export.*function.*${hook_name}\|export.*const.*${hook_name}" 2>/dev/null | head -1)"
        if [[ -n "$hook_file" ]] && grep -q "supabase" "$hook_file" 2>/dev/null; then
          deps="via hooks"
          break
        fi
      done
    fi
    [[ -z "$deps" ]] && deps="none"

    # Map to atomic design location (heuristic based on LOC and deps)
    local target="atoms"
    if [[ $loc -gt 100 || "$deps" != "none" ]]; then
      target="organisms"
    elif [[ $loc -gt 30 ]]; then
      target="molecules"
    fi

    echo "| $name | $loc | $deps | apps/web/src/components/$target/$name.tsx |" >> "$out_file"
    COUNT_COMPONENTS=$((COUNT_COMPONENTS + 1))
  done
}

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 7: Hooks
# ═══════════════════════════════════════════════════════════════════════════════
extract_hooks() {
  local out_file="$TMPDIR_MANIFEST/hooks.md"

  echo "| Hook | Type | Supabase Deps | Target Path |" > "$out_file"
  echo "|------|------|---------------|-------------|" >> "$out_file"

  find "$SRC_DIR/src" -name "use*.ts" -o -name "use*.tsx" 2>/dev/null | sort | while IFS= read -r file; do
    local name
    name="$(basename "$file" | sed 's/\.tsx\?$//')"
    local rel_path
    rel_path="$(echo "$file" | sed "s|$SRC_DIR/||")"

    # Categorize: query, mutation, or utility
    local hook_type="utility"
    if grep -q "useQuery\|useSuspenseQuery" "$file" 2>/dev/null; then
      hook_type="query"
    fi
    if grep -q "useMutation" "$file" 2>/dev/null; then
      if [[ "$hook_type" == "query" ]]; then
        hook_type="query+mutation"
      else
        hook_type="mutation"
      fi
    fi

    # Extract Supabase table dependencies
    local tables
    tables="$(grep -oE "\.from\(['\"][a-z_]+['\"]\)" "$file" 2>/dev/null | \
      sed "s/.*['\"]//;s/['\"].*//" | sort -u | tr '\n' ', ' | sed 's/,$//')"

    local fn_deps
    fn_deps="$(grep -oE "functions\.invoke\(['\"][a-z_-]+['\"]\)" "$file" 2>/dev/null | \
      sed "s/.*['\"]//;s/['\"].*//" | sort -u | tr '\n' ', ' | sed 's/,$//')"

    local deps=""
    [[ -n "$tables" ]] && deps="tables: $tables"
    [[ -n "$fn_deps" ]] && deps="${deps:+$deps; }fns: $fn_deps"
    [[ -z "$deps" ]] && deps="none"

    # Map to target path
    local target_dir="utils"
    case "$hook_type" in
      query|query+mutation) target_dir="queries" ;;
      mutation) target_dir="mutations" ;;
    esac

    echo "| $name | $hook_type | $deps | apps/web/src/hooks/$target_dir/$name.ts |" >> "$out_file"
    COUNT_HOOKS=$((COUNT_HOOKS + 1))
  done
}

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 8: RLS Policies
# ═══════════════════════════════════════════════════════════════════════════════
extract_rls() {
  local out_file="$TMPDIR_MANIFEST/rls.md"

  echo "| Table | Policy Name | Operation | Condition | Target Auth Check |" > "$out_file"
  echo "|-------|-------------|-----------|-----------|-------------------|" >> "$out_file"

  local migrations_dir="$SRC_DIR/supabase/migrations"
  if [[ ! -d "$migrations_dir" ]]; then
    echo "Warning: No migrations directory found — skipping RLS extraction" >&2
    return
  fi

  grep -rh "CREATE POLICY" "$migrations_dir"/ 2>/dev/null | while IFS= read -r line; do
    local policy_name
    policy_name="$(echo "$line" | grep -oE '"[^"]*"' | head -1 | tr -d '"')"

    local table
    table="$(echo "$line" | grep -oiE 'ON\s+(public\.)?[a-z_]+' | head -1 | sed 's/.*[. ]//i')"

    local operation="ALL"
    echo "$line" | grep -qiE 'FOR SELECT' && operation="SELECT"
    echo "$line" | grep -qiE 'FOR INSERT' && operation="INSERT"
    echo "$line" | grep -qiE 'FOR UPDATE' && operation="UPDATE"
    echo "$line" | grep -qiE 'FOR DELETE' && operation="DELETE"

    local condition
    condition="$(echo "$line" | grep -oE 'USING\s*\([^)]+\)' | head -1 | sed 's/USING\s*//')"
    [[ -z "$condition" ]] && condition="$(echo "$line" | grep -oE 'WITH CHECK\s*\([^)]+\)' | head -1 | sed 's/WITH CHECK\s*//')"
    [[ -z "$condition" ]] && condition="(see migration)"

    local target="service-layer check: verify user owns ${table} record"
    if echo "$condition" | grep -qi "auth.uid"; then
      target="service-layer: filter by current_user.id"
    fi

    echo "| $table | $policy_name | $operation | $condition | $target |" >> "$out_file"
    COUNT_RLS=$((COUNT_RLS + 1))
  done
}

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 9: Domain Checklists
# ═══════════════════════════════════════════════════════════════════════════════
generate_checklists() {
  local out_file="$TMPDIR_MANIFEST/checklists.md"
  > "$out_file"

  # Collect all unique table names as domains
  local types_file="$SRC_DIR/src/integrations/supabase/types.ts"
  local domains=()

  if [[ -f "$types_file" ]]; then
    while IFS= read -r table; do
      domains+=("$table")
    done < <(grep -E '^\s{4,6}[a-z_]+:\s*\{' "$types_file" | sed 's/^[[:space:]]*//' | cut -d: -f1 | sort -u)
  fi

  # Fallback: also extract from .from() calls
  while IFS= read -r table; do
    local found=0
    for d in "${domains[@]:-}"; do
      [[ "$d" == "$table" ]] && found=1 && break
    done
    [[ $found -eq 0 ]] && domains+=("$table")
  done < <(grep -rohE "\.from\(['\"][a-z_]+['\"]\)" "$SRC_DIR/src/" --include="*.ts" --include="*.tsx" 2>/dev/null | \
    sed "s/.*['\"]//;s/['\"].*//" | sort -u)

  for domain in "${domains[@]}"; do
    local pascal
    pascal="$(echo "$domain" | sed -r 's/(^|_)([a-z])/\U\2/g')"
    cat >> "$out_file" << EOF

### Domain: $domain
- [ ] Model: \`apps/api/models/${domain}.py\`
- [ ] Model registered in \`apps/api/models/__init__.py\`
- [ ] Schema: \`apps/api/schemas/${domain}.py\`
- [ ] Service: \`apps/api/services/${domain}_service.py\`
- [ ] Router: \`apps/api/routers/${domain}.py\`
- [ ] Router registered in \`apps/api/main.py\`
- [ ] Alembic migration generated
- [ ] TypeScript types: \`apps/web/src/lib/types/${domain}.ts\`
- [ ] Types exported from \`apps/web/src/lib/types/index.ts\`
- [ ] Repository: \`apps/web/src/lib/api/repositories/${domain}.repository.ts\`
- [ ] Repository exported from \`apps/web/src/lib/api/repositories/index.ts\`
- [ ] Query hooks: \`apps/web/src/hooks/queries/use${pascal}.ts\`
- [ ] Mutation hooks: \`apps/web/src/hooks/mutations/use${pascal}Mutations.ts\`
- [ ] Organisms ported to \`apps/web/src/components/organisms/\`
- [ ] Pages wired in \`apps/web/src/app/(app)/\`
- [ ] API paths verified (frontend basePath matches router prefix)
EOF
  done
}

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN — Run all extractors and assemble manifest
# ═══════════════════════════════════════════════════════════════════════════════
echo "Extracting from: $SRC_DIR"
echo "─────────────────────────────────────────"

echo "  [1/9] Tables..."
extract_tables

echo "  [2/9] Supabase queries..."
extract_queries

echo "  [3/9] Edge Functions..."
extract_edge_functions

echo "  [4/9] Auth patterns..."
extract_auth

echo "  [5/9] Page routes..."
extract_routes

echo "  [6/9] Components..."
extract_components

echo "  [7/9] Hooks..."
extract_hooks

echo "  [8/9] RLS policies..."
extract_rls

echo "  [9/9] Domain checklists..."
generate_checklists

# ─── Assemble final manifest ─────────────────────────────────────────────────
cat > "$OUT" << EOF
# PORT MANIFEST — $PROJECT_NAME
Generated: $DATE
Source: $SRC_DIR

## Summary
- Tables: $COUNT_TABLES
- Supabase queries: $COUNT_QUERIES
- Edge Functions: $COUNT_EDGE_FNS
- Auth patterns: $COUNT_AUTH
- Pages: $COUNT_PAGES
- Components: $COUNT_COMPONENTS
- Hooks: $COUNT_HOOKS
- RLS policies: $COUNT_RLS

---

## 1. Database Tables
$(cat "$TMPDIR_MANIFEST/tables.md")

## 2. Supabase Queries
$(cat "$TMPDIR_MANIFEST/queries.md")

## 3. Edge Functions
$(cat "$TMPDIR_MANIFEST/edge_functions.md")

## 4. Auth Patterns
$(cat "$TMPDIR_MANIFEST/auth.md")

## 5. Page Routes
$(cat "$TMPDIR_MANIFEST/routes.md")

## 6. Components
$(cat "$TMPDIR_MANIFEST/components.md")

## 7. Hooks
$(cat "$TMPDIR_MANIFEST/hooks.md")

## 8. RLS Policies
$(cat "$TMPDIR_MANIFEST/rls.md")

## 9. Domain Checklists
$(cat "$TMPDIR_MANIFEST/checklists.md")
EOF

echo "─────────────────────────────────────────"
echo "✓ Manifest written to: $OUT"
echo "  Tables: $COUNT_TABLES | Queries: $COUNT_QUERIES | Edge Functions: $COUNT_EDGE_FNS"
echo "  Auth: $COUNT_AUTH | Pages: $COUNT_PAGES | Components: $COUNT_COMPONENTS"
echo "  Hooks: $COUNT_HOOKS | RLS: $COUNT_RLS"
