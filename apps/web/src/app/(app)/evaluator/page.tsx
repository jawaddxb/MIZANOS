"use client";

import { useState } from "react";
import { EvaluatorForm } from "@/components/organisms/evaluator/EvaluatorForm";
import { EvaluationPreview } from "@/components/organisms/evaluator/EvaluationPreview";
import type { EvaluationResult } from "@/lib/types";

export default function EvaluatorPage() {
  const [result, setResult] = useState<EvaluationResult | null>(null);

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Repo Evaluator</h1>
        <p className="text-muted-foreground">
          Analyze any repository against Mizan Flow scaffolding conventions
        </p>
      </div>
      {result ? (
        <EvaluationPreview result={result} onReset={() => setResult(null)} />
      ) : (
        <EvaluatorForm onResult={setResult} />
      )}
    </div>
  );
}
