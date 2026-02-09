#!/usr/bin/env bash
# scaffold-domain.sh — Generate all 8 boilerplate files for a new domain
#
# Usage: ./scripts/scaffold-domain.sh <domain_name>
# Example: ./scripts/scaffold-domain.sh reports
#
# Generates:
#   1. apps/api/models/{domain}.py
#   2. apps/api/schemas/{domain}.py
#   3. apps/api/services/{domain}_service.py
#   4. apps/api/routers/{domain}.py
#   5. apps/web/src/lib/types/{domain}.ts
#   6. apps/web/src/lib/api/repositories/{domain}.repository.ts
#   7. apps/web/src/hooks/queries/use{Domain}.ts
#   8. apps/web/src/hooks/mutations/use{Domain}Mutations.ts

set -euo pipefail

# ─── Argument validation ───────────────────────────────────────────────

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <domain_name>"
  echo "Example: $0 reports"
  exit 1
fi

DOMAIN="$1"

# Validate: lowercase, underscores only
if [[ ! "$DOMAIN" =~ ^[a-z][a-z0-9_]*$ ]]; then
  echo "Error: domain_name must be lowercase letters, digits, and underscores (start with letter)"
  exit 1
fi

# ─── Name conversions ─────────────────────────────────────────────────

# snake_case → PascalCase (e.g., qa_checks → QaChecks)
to_pascal() {
  python3 -c "print(''.join(w.capitalize() for w in '$1'.split('_')))"
}

# snake_case → camelCase (e.g., qa_checks → qaChecks)
to_camel() {
  python3 -c "
parts = '$1'.split('_')
print(parts[0] + ''.join(w.capitalize() for w in parts[1:]))
"
}

PASCAL=$(to_pascal "$DOMAIN")
CAMEL=$(to_camel "$DOMAIN")

# ─── Project root detection ───────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ─── File paths ────────────────────────────────────────────────────────

MODEL="$ROOT/apps/api/models/${DOMAIN}.py"
SCHEMA="$ROOT/apps/api/schemas/${DOMAIN}.py"
SERVICE="$ROOT/apps/api/services/${DOMAIN}_service.py"
ROUTER="$ROOT/apps/api/routers/${DOMAIN}.py"
TYPES="$ROOT/apps/web/src/lib/types/${DOMAIN}.ts"
REPO="$ROOT/apps/web/src/lib/api/repositories/${DOMAIN}.repository.ts"
QUERY="$ROOT/apps/web/src/hooks/queries/use${PASCAL}.ts"
MUTATION="$ROOT/apps/web/src/hooks/mutations/use${PASCAL}Mutations.ts"

FILES=("$MODEL" "$SCHEMA" "$SERVICE" "$ROUTER" "$TYPES" "$REPO" "$QUERY" "$MUTATION")

# ─── Idempotency check ────────────────────────────────────────────────

CREATED=0
SKIPPED=0

write_if_absent() {
  local filepath="$1"
  local content="$2"
  if [[ -f "$filepath" ]]; then
    echo "  SKIP  $filepath (already exists)"
    SKIPPED=$((SKIPPED + 1))
  else
    mkdir -p "$(dirname "$filepath")"
    echo "$content" > "$filepath"
    echo "  CREATE  $filepath"
    CREATED=$((CREATED + 1))
  fi
}

echo ""
echo "Scaffolding domain: $DOMAIN ($PASCAL)"
echo "────────────────────────────────────────────"

# ─── 1. Model ──────────────────────────────────────────────────────────

write_if_absent "$MODEL" "\"\"\"${PASCAL} database model.\"\"\"

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from packages.common.db.base import Base, TimestampMixin, UUIDMixin


class ${PASCAL}(Base, UUIDMixin, TimestampMixin):
    \"\"\"${PASCAL} model.\"\"\"

    __tablename__ = \"${DOMAIN}\"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    # TODO: Add real columns from Supabase table"

# ─── 2. Schema ─────────────────────────────────────────────────────────

write_if_absent "$SCHEMA" "\"\"\"${PASCAL} Pydantic schemas.\"\"\"

from uuid import UUID
from datetime import datetime

from apps.api.schemas.base import BaseSchema, PaginatedResponse


class ${PASCAL}Base(BaseSchema):
    \"\"\"Shared fields for ${PASCAL}.\"\"\"

    name: str


class ${PASCAL}Create(${PASCAL}Base):
    \"\"\"Schema for creating a ${PASCAL}.\"\"\"

    pass


class ${PASCAL}Update(BaseSchema):
    \"\"\"Schema for updating a ${PASCAL}.\"\"\"

    name: str | None = None


class ${PASCAL}Response(${PASCAL}Base):
    \"\"\"Schema for ${PASCAL} API responses.\"\"\"

    id: UUID
    created_at: datetime
    updated_at: datetime


class ${PASCAL}ListResponse(PaginatedResponse):
    \"\"\"Paginated list of ${PASCAL} items.\"\"\"

    data: list[${PASCAL}Response]"

# ─── 3. Service ────────────────────────────────────────────────────────

write_if_absent "$SERVICE" "\"\"\"${PASCAL} service with business logic.\"\"\"

from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.models.${DOMAIN} import ${PASCAL}
from apps.api.services.base_service import BaseService


class ${PASCAL}Service(BaseService[${PASCAL}]):
    \"\"\"Service for ${PASCAL} operations.\"\"\"

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(${PASCAL}, session)"

# ─── 4. Router ─────────────────────────────────────────────────────────

write_if_absent "$ROUTER" "\"\"\"${PASCAL} router.\"\"\"

from uuid import UUID

from fastapi import APIRouter, Depends, Query

from apps.api.dependencies import CurrentUser, DbSession
from apps.api.schemas.${DOMAIN} import (
    ${PASCAL}Create,
    ${PASCAL}ListResponse,
    ${PASCAL}Response,
    ${PASCAL}Update,
)
from apps.api.services.${DOMAIN}_service import ${PASCAL}Service

router = APIRouter()


def get_service(db: DbSession) -> ${PASCAL}Service:
    return ${PASCAL}Service(db)


@router.get(\"\", response_model=${PASCAL}ListResponse)
async def list_${DOMAIN}(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    search: str | None = None,
    user: CurrentUser = None,
    service: ${PASCAL}Service = Depends(get_service),
):
    \"\"\"List ${DOMAIN} with pagination.\"\"\"
    offset = (page - 1) * page_size
    items = await service.list(offset=offset, limit=page_size)
    total = await service.count()
    return ${PASCAL}ListResponse(
        data=items,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(\"/{item_id}\", response_model=${PASCAL}Response)
async def get_${DOMAIN}_item(
    item_id: UUID,
    user: CurrentUser = None,
    service: ${PASCAL}Service = Depends(get_service),
):
    \"\"\"Get a single ${DOMAIN} item by ID.\"\"\"
    return await service.get_or_404(item_id)


@router.post(\"\", response_model=${PASCAL}Response, status_code=201)
async def create_${DOMAIN}_item(
    body: ${PASCAL}Create,
    user: CurrentUser = None,
    service: ${PASCAL}Service = Depends(get_service),
):
    \"\"\"Create a new ${DOMAIN} item.\"\"\"
    from apps.api.models.${DOMAIN} import ${PASCAL} as ${PASCAL}Model
    entity = ${PASCAL}Model(**body.model_dump())
    return await service.create(entity)


@router.patch(\"/{item_id}\", response_model=${PASCAL}Response)
async def update_${DOMAIN}_item(
    item_id: UUID,
    body: ${PASCAL}Update,
    user: CurrentUser = None,
    service: ${PASCAL}Service = Depends(get_service),
):
    \"\"\"Update a ${DOMAIN} item.\"\"\"
    return await service.update(item_id, body.model_dump(exclude_unset=True))


@router.delete(\"/{item_id}\", status_code=204)
async def delete_${DOMAIN}_item(
    item_id: UUID,
    user: CurrentUser = None,
    service: ${PASCAL}Service = Depends(get_service),
):
    \"\"\"Delete a ${DOMAIN} item.\"\"\"
    await service.delete(item_id)"

# ─── 5. TypeScript types ──────────────────────────────────────────────

write_if_absent "$TYPES" "export interface ${PASCAL} {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface ${PASCAL}Create {
  name: string;
}

export interface ${PASCAL}Update {
  name?: string;
}"

# ─── 6. Repository ────────────────────────────────────────────────────

write_if_absent "$REPO" "import { BaseRepository } from \"./base.repository\";
import type { ${PASCAL}, ${PASCAL}Create, ${PASCAL}Update } from \"@/lib/types/${DOMAIN}\";

export class ${PASCAL}Repository extends BaseRepository<${PASCAL}, ${PASCAL}Create, ${PASCAL}Update> {
  protected readonly basePath = \"/${DOMAIN}\";
}

export const ${CAMEL}Repository = new ${PASCAL}Repository();"

# ─── 7. Query hook ─────────────────────────────────────────────────────

write_if_absent "$QUERY" "\"use client\";

import { useQuery } from \"@tanstack/react-query\";
import { ${CAMEL}Repository } from \"@/lib/api/repositories/${DOMAIN}.repository\";
import type { ${PASCAL} } from \"@/lib/types/${DOMAIN}\";

export function use${PASCAL}s() {
  return useQuery({
    queryKey: [\"${DOMAIN}\"],
    queryFn: async (): Promise<${PASCAL}[]> => {
      const result = await ${CAMEL}Repository.getAll({
        sortBy: \"updated_at\",
        sortOrder: \"desc\",
      });
      return result.data;
    },
  });
}

export function use${PASCAL}(id: string) {
  return useQuery({
    queryKey: [\"${DOMAIN}\", id],
    queryFn: (): Promise<${PASCAL}> => ${CAMEL}Repository.getById(id),
    enabled: !!id,
  });
}"

# ─── 8. Mutation hooks ────────────────────────────────────────────────

write_if_absent "$MUTATION" "\"use client\";

import { useMutation, useQueryClient } from \"@tanstack/react-query\";
import { ${CAMEL}Repository } from \"@/lib/api/repositories/${DOMAIN}.repository\";
import type { ${PASCAL}, ${PASCAL}Create, ${PASCAL}Update } from \"@/lib/types/${DOMAIN}\";
import { toast } from \"sonner\";

export function useCreate${PASCAL}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ${PASCAL}Create): Promise<${PASCAL}> =>
      ${CAMEL}Repository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [\"${DOMAIN}\"] });
      toast.success(\"${PASCAL} created\");
    },
    onError: (error: Error) => {
      toast.error(\"Failed to create ${DOMAIN}: \" + error.message);
    },
  });
}

export function useUpdate${PASCAL}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & ${PASCAL}Update): Promise<${PASCAL}> =>
      ${CAMEL}Repository.update(id, updates),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [\"${DOMAIN}\"] });
      queryClient.invalidateQueries({ queryKey: [\"${DOMAIN}\", variables.id] });
      toast.success(\"${PASCAL} updated\");
    },
    onError: (error: Error) => {
      toast.error(\"Failed to update ${DOMAIN}: \" + error.message);
    },
  });
}

export function useDelete${PASCAL}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string): Promise<void> =>
      ${CAMEL}Repository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [\"${DOMAIN}\"] });
      toast.success(\"${PASCAL} deleted\");
    },
    onError: (error: Error) => {
      toast.error(\"Failed to delete ${DOMAIN}: \" + error.message);
    },
  });
}"

# ─── Summary ───────────────────────────────────────────────────────────

echo ""
echo "────────────────────────────────────────────"
echo "Done! Created: $CREATED, Skipped: $SKIPPED"
echo ""

if [[ $CREATED -gt 0 ]]; then
  echo "Manual steps required:"
  echo ""
  echo "  1. Register model in apps/api/models/__init__.py:"
  echo "     from .${DOMAIN} import ${PASCAL}"
  echo "     + add \"${PASCAL}\" to __all__"
  echo ""
  echo "  2. Register router in apps/api/main.py:"
  echo "     from apps.api.routers import ${DOMAIN}"
  echo "     app.include_router(${DOMAIN}.router, prefix=\"/${DOMAIN}\", tags=[\"${DOMAIN}\"])"
  echo ""
  echo "  3. Export types from apps/web/src/lib/types/index.ts:"
  echo "     export type { ${PASCAL}, ${PASCAL}Create, ${PASCAL}Update } from \"./${DOMAIN}\";"
  echo ""
  echo "  4. Export repository from apps/web/src/lib/api/repositories/index.ts:"
  echo "     export { ${PASCAL}Repository, ${CAMEL}Repository } from \"./${DOMAIN}.repository\";"
  echo ""
  echo "  5. Generate Alembic migration:"
  echo "     cd apps/api && alembic revision --autogenerate -m \"add ${DOMAIN} table\""
  echo ""
  echo "  6. Fill in real columns/fields (replace placeholder 'name' field)"
  echo ""
fi
