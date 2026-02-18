"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { ROUTE_LABELS, capitalizeSegment } from "@/lib/constants";
import { useProduct } from "@/hooks/queries/useProducts";
import { useProfile } from "@/hooks/queries/useProfiles";
import { useTaskTemplateGroupDetail } from "@/hooks/queries/useTaskTemplateGroups";

export interface BreadcrumbItem {
  label: string;
  href: string;
  isActive: boolean;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUUID(segment: string): boolean {
  return UUID_REGEX.test(segment);
}

export function useBreadcrumbs(): BreadcrumbItem[] {
  const pathname = usePathname();

  const segments = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    return parts;
  }, [pathname]);

  // Determine which dynamic entity hooks to call based on route
  const parentSegment = segments[0] ?? "";
  const idSegment = segments[1] ?? "";
  const hasId = segments.length >= 2 && isUUID(idSegment);

  const productQuery = useProduct(
    parentSegment === "projects" && hasId ? idSegment : "",
  );
  const profileQuery = useProfile(
    parentSegment === "team" && hasId ? idSegment : "",
  );
  const templateGroupQuery = useTaskTemplateGroupDetail(
    parentSegment === "templates" && hasId ? idSegment : null,
  );

  return useMemo(() => {
    if (pathname === "/") {
      return [{ label: "Dashboard", href: "/", isActive: true }];
    }

    const items: BreadcrumbItem[] = [
      { label: "Dashboard", href: "/", isActive: false },
    ];

    let currentPath = "";

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      currentPath += `/${segment}`;
      const isLast = i === segments.length - 1;

      if (isUUID(segment)) {
        let entityLabel = "...";

        if (parentSegment === "projects" && productQuery.data) {
          entityLabel = productQuery.data.name;
        } else if (parentSegment === "team" && profileQuery.data) {
          entityLabel = profileQuery.data.full_name ?? profileQuery.data.email ?? "Member";
        } else if (parentSegment === "templates" && templateGroupQuery.data) {
          entityLabel = templateGroupQuery.data.name;
        }

        items.push({ label: entityLabel, href: currentPath, isActive: isLast });
      } else {
        const staticLabel = ROUTE_LABELS[currentPath] ?? capitalizeSegment(segment);
        items.push({ label: staticLabel, href: currentPath, isActive: isLast });
      }
    }

    return items;
  }, [pathname, segments, parentSegment, productQuery.data, profileQuery.data, templateGroupQuery.data]);
}
