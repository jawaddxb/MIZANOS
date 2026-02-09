import type { PillarType } from "@/lib/types";

export interface PillarConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}

export const PILLAR_CONFIG: Record<PillarType, PillarConfig> = {
  development: {
    label: "Development",
    color: "var(--pillar-development)",
    bgColor: "var(--pillar-development-bg)",
    borderColor: "var(--pillar-development-border)",
    icon: "Code",
  },
  product: {
    label: "Product",
    color: "var(--pillar-product)",
    bgColor: "var(--pillar-product-bg)",
    borderColor: "var(--pillar-product-border)",
    icon: "Package",
  },
  business: {
    label: "Business",
    color: "var(--pillar-business)",
    bgColor: "var(--pillar-business-bg)",
    borderColor: "var(--pillar-business-border)",
    icon: "Briefcase",
  },
  marketing: {
    label: "Marketing",
    color: "var(--pillar-marketing)",
    bgColor: "var(--pillar-marketing-bg)",
    borderColor: "var(--pillar-marketing-border)",
    icon: "Megaphone",
  },
} as const;

export const PILLAR_ORDER: PillarType[] = [
  "development",
  "product",
  "business",
  "marketing",
];
