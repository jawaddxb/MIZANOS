#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# verify-port.sh
# Runs after porting a Lovable app to verify 100% coverage with zero gaps.
# Returns exit code 0 only if all checks pass.
#
# Usage: ./scripts/verify-port.sh /path/to/lovable-source
# ─────────────────────────────────────────────────────────────────────────────

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 /path/to/lovable-source"
  exit 1
fi

SRC_DIR="$(cd "$1" && pwd)"
MONOREPO="$(cd "$(dirname "$0")/.." && pwd)"
DATE="$(date +%Y-%m-%d)"
FAIL=0
PASS=0
TOTAL=0
DETAILS=""

# ─── Helpers ─────────────────────────────────────────────────────────────────
check_pass() {
  local label="$1"
  local count="$2"
  local total="$3"
  TOTAL=$((TOTAL + 1))
  if [[ "$count" -eq "$total" ]]; then
    echo "✓ $label: $count/$total covered"
    PASS=$((PASS + 1))
  else
    local missing=$((total - count))
    echo "✗ $label: $count/$total covered — $missing MISSING"
    FAIL=$((FAIL + 1))
  fi
}

check_zero() {
  local label="$1"
  local count="$2"
  TOTAL=$((TOTAL + 1))
  if [[ "$count" -eq 0 ]]; then
    echo "✓ $label: 0 found"
    PASS=$((PASS + 1))
  else
    echo "✗ $label: $count found"
    FAIL=$((FAIL + 1))
  fi
}

echo "PORT VERIFICATION — $DATE"
echo "Source:   $SRC_DIR"
echo "Monorepo: $MONOREPO"
echo "═══════════════════════════════════════════════"

# ═══════════════════════════════════════════════════════════════════════════════
# CHECK 1: Table Coverage
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "── Table Coverage ──"

TABLE_TOTAL=0
TABLE_COVERED=0
TABLE_MISSING=""

types_file="$SRC_DIR/src/integrations/supabase/types.ts"
if [[ -f "$types_file" ]]; then
  while IFS= read -r table; do
    TABLE_TOTAL=$((TABLE_TOTAL + 1))
    if [[ -f "$MONOREPO/apps/api/models/${table}.py" ]]; then
      TABLE_COVERED=$((TABLE_COVERED + 1))
    else
      TABLE_MISSING="${TABLE_MISSING}  - $table (expected: apps/api/models/${table}.py)\n"
    fi
  done < <(grep -E '^\s{4,6}[a-z_]+:\s*\{' "$types_file" | sed 's/^[[:space:]]*//' | cut -d: -f1 | sort -u)
fi

check_pass "Tables" "$TABLE_COVERED" "$TABLE_TOTAL"
[[ -n "$TABLE_MISSING" ]] && DETAILS="${DETAILS}\nMissing models:\n${TABLE_MISSING}"

# ═══════════════════════════════════════════════════════════════════════════════
# CHECK 2: Query Coverage (every queried table has a repository)
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "── Query Coverage ──"

QUERY_TABLES_TOTAL=0
QUERY_TABLES_COVERED=0
QUERY_MISSING=""

while IFS= read -r table; do
  [[ -z "$table" ]] && continue
  QUERY_TABLES_TOTAL=$((QUERY_TABLES_TOTAL + 1))

  # Check if a repository exists that references this table
  local_repo="$MONOREPO/apps/web/src/lib/api/repositories/${table}.repository.ts"
  # Also check with hyphens
  local_repo_hyphen="$MONOREPO/apps/web/src/lib/api/repositories/$(echo "$table" | tr '_' '-').repository.ts"

  if [[ -f "$local_repo" || -f "$local_repo_hyphen" ]]; then
    QUERY_TABLES_COVERED=$((QUERY_TABLES_COVERED + 1))
  else
    # Check if any repository file references this table name
    if grep -rl "/${table}\|${table}Repository" "$MONOREPO/apps/web/src/lib/api/repositories/" \
      --include="*.ts" 2>/dev/null | grep -q .; then
      QUERY_TABLES_COVERED=$((QUERY_TABLES_COVERED + 1))
    else
      QUERY_MISSING="${QUERY_MISSING}  - $table (no repository found)\n"
    fi
  fi
done < <(grep -rohE "\.from\(['\"][a-z_]+['\"]\)" "$SRC_DIR/src/" \
  --include="*.ts" --include="*.tsx" 2>/dev/null | \
  sed "s/.*['\"]//;s/['\"].*//" | sort -u)

check_pass "Query tables → repositories" "$QUERY_TABLES_COVERED" "$QUERY_TABLES_TOTAL"
[[ -n "$QUERY_MISSING" ]] && DETAILS="${DETAILS}\nMissing repositories:\n${QUERY_MISSING}"

# ═══════════════════════════════════════════════════════════════════════════════
# CHECK 3: Edge Function Coverage
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "── Edge Function Coverage ──"

FN_TOTAL=0
FN_COVERED=0
FN_MISSING=""

fn_dir="$SRC_DIR/supabase/functions"
if [[ -d "$fn_dir" ]]; then
  for fn_path in "$fn_dir"/*/; do
    [[ ! -d "$fn_path" ]] && continue
    fn_name="$(basename "$fn_path")"
    [[ "$fn_name" == "_shared" ]] && continue
    FN_TOTAL=$((FN_TOTAL + 1))

    fn_snake="$(echo "$fn_name" | tr '-' '_')"

    # Check for a matching service method or router endpoint
    if grep -rl "$fn_snake\|$fn_name" \
      "$MONOREPO/apps/api/services/" "$MONOREPO/apps/api/routers/" \
      --include="*.py" 2>/dev/null | grep -q .; then
      FN_COVERED=$((FN_COVERED + 1))
    else
      FN_MISSING="${FN_MISSING}  - $fn_name\n"
    fi
  done
fi

check_pass "Edge Functions" "$FN_COVERED" "$FN_TOTAL"
[[ -n "$FN_MISSING" ]] && DETAILS="${DETAILS}\nMissing Edge Functions:\n${FN_MISSING}"

# ═══════════════════════════════════════════════════════════════════════════════
# CHECK 4: Route Coverage
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "── Route Coverage ──"

ROUTE_TOTAL=0
ROUTE_COVERED=0
ROUTE_MISSING=""

app_file=""
for candidate in "$SRC_DIR/src/App.tsx" "$SRC_DIR/src/app/App.tsx" "$SRC_DIR/src/routes.tsx"; do
  [[ -f "$candidate" ]] && app_file="$candidate" && break
done

if [[ -n "$app_file" ]]; then
  while IFS= read -r path; do
    [[ -z "$path" || "$path" == "/" ]] && continue
    ROUTE_TOTAL=$((ROUTE_TOTAL + 1))

    # Convert route path to file system path
    # /products/:id → products/[id]
    local fs_path
    fs_path="$(echo "$path" | sed 's|^/||;s|:([a-z_]+)|\[\1\]|g')"

    if [[ -d "$MONOREPO/apps/web/src/app/(app)/$fs_path" ]] || \
       [[ -f "$MONOREPO/apps/web/src/app/(app)/$fs_path/page.tsx" ]] || \
       [[ -d "$MONOREPO/apps/web/src/app/(auth)/$fs_path" ]] || \
       [[ -f "$MONOREPO/apps/web/src/app/(auth)/$fs_path/page.tsx" ]]; then
      ROUTE_COVERED=$((ROUTE_COVERED + 1))
    else
      ROUTE_MISSING="${ROUTE_MISSING}  - $path\n"
    fi
  done < <(grep -oE 'path="[^"]*"' "$app_file" 2>/dev/null | sed 's/path="//;s/"//' | sort -u)
fi

check_pass "Routes" "$ROUTE_COVERED" "$ROUTE_TOTAL"
[[ -n "$ROUTE_MISSING" ]] && DETAILS="${DETAILS}\nMissing routes:\n${ROUTE_MISSING}"

# ═══════════════════════════════════════════════════════════════════════════════
# CHECK 5: Hook Coverage
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "── Hook Coverage ──"

HOOK_TOTAL=0
HOOK_COVERED=0
HOOK_MISSING=""

while IFS= read -r hook_file; do
  [[ -z "$hook_file" ]] && continue
  hook_name="$(basename "$hook_file" | sed 's/\.tsx\?$//')"

  # Only count hooks that have Supabase dependencies
  if ! grep -q "supabase\|\.from(" "$hook_file" 2>/dev/null; then
    continue
  fi

  HOOK_TOTAL=$((HOOK_TOTAL + 1))

  # Check if a corresponding hook exists in the monorepo
  if find "$MONOREPO/apps/web/src/hooks" -name "${hook_name}.*" 2>/dev/null | grep -q .; then
    HOOK_COVERED=$((HOOK_COVERED + 1))
  else
    HOOK_MISSING="${HOOK_MISSING}  - $hook_name\n"
  fi
done < <(find "$SRC_DIR/src" -name "use*.ts" -o -name "use*.tsx" 2>/dev/null)

check_pass "Hooks (with Supabase deps)" "$HOOK_COVERED" "$HOOK_TOTAL"
[[ -n "$HOOK_MISSING" ]] && DETAILS="${DETAILS}\nMissing hooks:\n${HOOK_MISSING}"

# ═══════════════════════════════════════════════════════════════════════════════
# CHECK 6: No Supabase Remnants
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "── Remnant Checks ──"

SUPA_COUNT="$(grep -r "supabase" \
  "$MONOREPO/apps/web/src/" "$MONOREPO/apps/api/" \
  --include="*.ts" --include="*.tsx" --include="*.py" \
  2>/dev/null | grep -v node_modules | grep -v ".git" | wc -l | tr -d ' ')"

check_zero "Supabase references in monorepo" "$SUPA_COUNT"
if [[ "$SUPA_COUNT" -gt 0 ]]; then
  DETAILS="${DETAILS}\nSupabase remnants:\n"
  DETAILS="${DETAILS}$(grep -rn "supabase" \
    "$MONOREPO/apps/web/src/" "$MONOREPO/apps/api/" \
    --include="*.ts" --include="*.tsx" --include="*.py" \
    2>/dev/null | grep -v node_modules | grep -v ".git" | head -20)\n"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# CHECK 7: No Stubs
# ═══════════════════════════════════════════════════════════════════════════════
STUB_COUNT="$(grep -rn "TODO\|FIXME\|stub\|NotImplementedError" \
  "$MONOREPO/apps/web/src/" "$MONOREPO/apps/api/" \
  --include="*.ts" --include="*.tsx" --include="*.py" \
  2>/dev/null | grep -v node_modules | wc -l | tr -d ' ')"

check_zero "Stubs/TODOs in monorepo" "$STUB_COUNT"
if [[ "$STUB_COUNT" -gt 0 ]]; then
  DETAILS="${DETAILS}\nStubs found:\n"
  DETAILS="${DETAILS}$(grep -rn "TODO\|FIXME\|stub\|NotImplementedError" \
    "$MONOREPO/apps/web/src/" "$MONOREPO/apps/api/" \
    --include="*.ts" --include="*.tsx" --include="*.py" \
    2>/dev/null | grep -v node_modules | head -20)\n"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# CHECK 8: Barrel File Completeness
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "── Barrel File Checks ──"

BARREL_TOTAL=0
BARREL_COVERED=0
BARREL_MISSING=""

# Check each model has a barrel export
for model_file in "$MONOREPO/apps/api/models"/*.py; do
  [[ ! -f "$model_file" ]] && continue
  model_name="$(basename "$model_file" .py)"
  [[ "$model_name" == "__init__" || "$model_name" == "base" ]] && continue
  BARREL_TOTAL=$((BARREL_TOTAL + 1))

  if grep -q "$model_name" "$MONOREPO/apps/api/models/__init__.py" 2>/dev/null; then
    BARREL_COVERED=$((BARREL_COVERED + 1))
  else
    BARREL_MISSING="${BARREL_MISSING}  - $model_name not in models/__init__.py\n"
  fi
done

# Check each router is registered in main.py
for router_file in "$MONOREPO/apps/api/routers"/*.py; do
  [[ ! -f "$router_file" ]] && continue
  router_name="$(basename "$router_file" .py)"
  [[ "$router_name" == "__init__" ]] && continue
  BARREL_TOTAL=$((BARREL_TOTAL + 1))

  if grep -q "$router_name" "$MONOREPO/apps/api/main.py" 2>/dev/null; then
    BARREL_COVERED=$((BARREL_COVERED + 1))
  else
    BARREL_MISSING="${BARREL_MISSING}  - $router_name not in main.py\n"
  fi
done

# Check each repository is exported
for repo_file in "$MONOREPO/apps/web/src/lib/api/repositories"/*.repository.ts; do
  [[ ! -f "$repo_file" ]] && continue
  repo_name="$(basename "$repo_file" .ts)"
  BARREL_TOTAL=$((BARREL_TOTAL + 1))

  if grep -q "$repo_name" "$MONOREPO/apps/web/src/lib/api/repositories/index.ts" 2>/dev/null; then
    BARREL_COVERED=$((BARREL_COVERED + 1))
  else
    BARREL_MISSING="${BARREL_MISSING}  - $repo_name not in repositories/index.ts\n"
  fi
done

check_pass "Barrel file registrations" "$BARREL_COVERED" "$BARREL_TOTAL"
[[ -n "$BARREL_MISSING" ]] && DETAILS="${DETAILS}\nMissing barrel exports:\n${BARREL_MISSING}"

# ═══════════════════════════════════════════════════════════════════════════════
# CHECK 9: Route Alignment (basePath ↔ router prefix)
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "── Route Alignment ──"

ALIGN_TOTAL=0
ALIGN_COVERED=0
ALIGN_MISSING=""

for repo_file in "$MONOREPO/apps/web/src/lib/api/repositories"/*.repository.ts; do
  [[ ! -f "$repo_file" ]] && continue
  base_path="$(grep -oE "basePath\s*=\s*['\"][^'\"]+['\"]" "$repo_file" 2>/dev/null | \
    head -1 | sed "s/.*['\"]//;s/['\"].*//")"
  [[ -z "$base_path" ]] && continue

  ALIGN_TOTAL=$((ALIGN_TOTAL + 1))

  # Check if a router with this prefix exists
  if grep -q "prefix=\"${base_path}\"" "$MONOREPO/apps/api/main.py" 2>/dev/null || \
     grep -q "prefix='${base_path}'" "$MONOREPO/apps/api/main.py" 2>/dev/null; then
    ALIGN_COVERED=$((ALIGN_COVERED + 1))
  else
    repo_name="$(basename "$repo_file")"
    ALIGN_MISSING="${ALIGN_MISSING}  - $repo_name: basePath=$base_path has no matching router prefix\n"
  fi
done

check_pass "Route alignment (basePath ↔ prefix)" "$ALIGN_COVERED" "$ALIGN_TOTAL"
[[ -n "$ALIGN_MISSING" ]] && DETAILS="${DETAILS}\nRoute alignment issues:\n${ALIGN_MISSING}"

# ═══════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════════"

if [[ -n "$DETAILS" ]]; then
  echo ""
  echo "DETAILS:"
  echo -e "$DETAILS"
fi

echo ""
if [[ $FAIL -eq 0 ]]; then
  echo "RESULT: PASS ($PASS/$TOTAL checks passed)"
  exit 0
else
  echo "RESULT: FAIL ($FAIL gaps found, $PASS/$TOTAL checks passed)"
  exit 1
fi
