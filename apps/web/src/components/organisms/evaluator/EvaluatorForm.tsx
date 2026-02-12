"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/display/Card";
import { Button } from "@/components/molecules/buttons/Button";
import { BaseInput } from "@/components/atoms/inputs/BaseInput";
import { useEvaluateRepo } from "@/hooks/mutations/useRepoEvaluator";
import { BrowseDirectoryDialog } from "@/components/organisms/evaluator/BrowseDirectoryDialog";
import type { EvaluationResult } from "@/lib/types";
import { Search, Loader2, FolderSearch, FolderOpen } from "lucide-react";

interface EvaluatorFormProps {
  onResult: (result: EvaluationResult) => void;
}

function EvaluatorForm({ onResult }: EvaluatorFormProps) {
  const [repoPath, setRepoPath] = useState("");
  const [browseOpen, setBrowseOpen] = useState(false);
  const evaluate = useEvaluateRepo();

  const handleEvaluate = () => {
    evaluate.mutate(repoPath, {
      onSuccess: (data) => onResult(data),
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderSearch className="h-5 w-5 text-primary" />
            Repo Evaluator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter the local path to any git repository. The evaluator will analyze
            its structure, code patterns, and alignment with Mizan Flow conventions.
          </p>
          <div className="flex gap-2">
            <BaseInput
              placeholder="/path/to/repository"
              value={repoPath}
              onChange={(e) => setRepoPath(e.target.value)}
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              onClick={() => setBrowseOpen(true)}
              leftIcon={<FolderOpen className="h-4 w-4" />}
            >
              Browse
            </Button>
            <Button
              onClick={handleEvaluate}
              loading={evaluate.isPending}
              disabled={!repoPath.trim()}
              leftIcon={evaluate.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Search className="h-4 w-4" />
              }
            >
              Evaluate
            </Button>
          </div>
        </CardContent>
      </Card>

      <BrowseDirectoryDialog
        open={browseOpen}
        onOpenChange={setBrowseOpen}
        onSelect={setRepoPath}
      />
    </>
  );
}

export { EvaluatorForm };
export type { EvaluatorFormProps };
