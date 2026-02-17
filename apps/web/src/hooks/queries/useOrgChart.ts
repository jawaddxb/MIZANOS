"use client";

import { useQuery } from "@tanstack/react-query";
import { orgChartRepository } from "@/lib/api/repositories";
import type { OrgChartNode } from "@/lib/types";

export function useOrgChart() {
  return useQuery<OrgChartNode[]>({
    queryKey: ["org-chart"],
    queryFn: () => orgChartRepository.getTree(),
  });
}
