"use client";

import { useState } from "react";
import { TestTube } from "lucide-react";
import { PageHeader } from "@/components/molecules/layout/PageHeader";
import { EvaluatorForm } from "@/components/organisms/evaluator/EvaluatorForm";
import { EvaluationPreview } from "@/components/organisms/evaluator/EvaluationPreview";
import type { EvaluationResult } from "@/lib/types";

export default function EvaluatorPage() {
  const [result, setResult] = useState<EvaluationResult | null>(null);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Repo Evaluator"
        subtitle="Analyze any repository against Mizan Flow scaffolding conventions"
        icon={<TestTube className="h-5 w-5 text-primary" />}
      />
      {result ? (
        <EvaluationPreview result={result} onReset={() => setResult(null)} />
      ) : (
        <EvaluatorForm onResult={setResult} />
      )}
    </div>
  );
}
