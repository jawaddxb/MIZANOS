export const PRODUCT_STAGES = [
  "Intake",
  "Development",
  "QA",
  "Security",
  "Deployment",
] as const;

export type ProductStage = (typeof PRODUCT_STAGES)[number];
