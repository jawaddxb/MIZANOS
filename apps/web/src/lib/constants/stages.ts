export const PRODUCT_STAGES = [
  "Intake",
  "Development",
  "QA",
  "Security",
  "Deployment",
  "Live",
] as const;

export type ProductStage = (typeof PRODUCT_STAGES)[number];
