"use client";

import { useState } from "react";
import { RotateCcw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { BaseButton } from "@/components/atoms/buttons/BaseButton";
import { ConfirmDialog } from "@/components/molecules/feedback/ConfirmDialog";
import {
  ModelConfigEditor,
  type ModelConfig,
} from "@/components/molecules/forms/ModelConfigEditor";
import { PromptEditor } from "@/components/molecules/forms/PromptEditor";
import { useUpdateOrgSetting } from "@/hooks/mutations/useOrgSettingMutations";
import type { OrgSetting } from "@/lib/types";

export interface AiDefaults {
  model_config: ModelConfig;
  system_prompts: Record<string, string>;
}

interface AIConfigSectionProps {
  settings: OrgSetting[];
  defaults: AiDefaults | null;
  isPending: boolean;
}

const DEFAULT_MODEL_CONFIG: ModelConfig = {
  provider: "openrouter",
  model: "anthropic/claude-sonnet-4",
  temperature: 0.7,
  max_tokens: 4096,
};

const PROMPT_LABELS: Record<string, string> = {
  chat: "Chat Assistant",
  spec_generation_rules: "Spec Generation Rules",
  qa_check: "QA Checklist Generation",
};

const SUB_TABS = [
  { id: "parameters", label: "Model Parameters" },
  { id: "prompts", label: "System Prompts" },
] as const;

type SubTab = (typeof SUB_TABS)[number]["id"];

function getModelConfig(settings: OrgSetting[]): ModelConfig {
  const setting = settings.find((s) => s.key === "ai_model_config");
  const val = setting?.value as Record<string, unknown> | undefined;
  if (!val) return DEFAULT_MODEL_CONFIG;
  return {
    provider: (val.provider as string) || DEFAULT_MODEL_CONFIG.provider,
    model: (val.model as string) || DEFAULT_MODEL_CONFIG.model,
    temperature:
      typeof val.temperature === "number"
        ? val.temperature
        : DEFAULT_MODEL_CONFIG.temperature,
    max_tokens:
      typeof val.max_tokens === "number"
        ? val.max_tokens
        : DEFAULT_MODEL_CONFIG.max_tokens,
  };
}

function getSystemPrompts(settings: OrgSetting[]): Record<string, string> {
  const setting = settings.find((s) => s.key === "ai_system_prompts");
  const val = setting?.value as Record<string, unknown> | undefined;
  if (!val) return {};
  const result: Record<string, string> = {};
  for (const key of Object.keys(PROMPT_LABELS)) {
    const v = val[key];
    if (typeof v === "string") result[key] = v;
  }
  return result;
}

export function AIConfigSection({
  settings,
  defaults,
  isPending,
}: AIConfigSectionProps) {
  const [activeTab, setActiveTab] = useState<SubTab>("parameters");
  const [confirmResetPrompts, setConfirmResetPrompts] = useState(false);
  const updateSetting = useUpdateOrgSetting();

  const modelConfig = getModelConfig(settings);
  const prompts = getSystemPrompts(settings);
  const defaultModelConfig = defaults?.model_config ?? DEFAULT_MODEL_CONFIG;
  const defaultPrompts = defaults?.system_prompts ?? {};

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">AI Configuration</h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            <ShieldCheck className="h-3 w-3" />
            Super Admin
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure the AI model and system prompts used across the platform.
        </p>
      </div>

      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "parameters" && (
        <ModelConfigEditor
          config={modelConfig}
          defaultConfig={defaultModelConfig}
          isPending={isPending}
        />
      )}

      {activeTab === "prompts" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Customize the instructions given to the AI for each feature.
              Reset individual prompts or all prompts to system defaults.
            </p>
            {Object.keys(prompts).length > 0 && (
              <BaseButton
                variant="ghost"
                size="sm"
                onClick={() => setConfirmResetPrompts(true)}
                disabled={isPending}
                className="shrink-0 gap-1.5 text-xs"
              >
                <RotateCcw className="h-3 w-3" />
                Load System Defaults
              </BaseButton>
            )}
          </div>
          {Object.entries(PROMPT_LABELS).map(([key, label]) => (
            <PromptEditor
              key={key}
              promptKey={key}
              label={label}
              value={prompts[key] ?? ""}
              defaultValue={defaultPrompts[key] ?? ""}
              allPrompts={prompts}
              isPending={isPending}
            />
          ))}
        </div>
      )}
      {confirmResetPrompts && (
        <ConfirmDialog
          open={confirmResetPrompts}
          onOpenChange={setConfirmResetPrompts}
          title="Reset All Prompts"
          description="This will discard all custom system prompts and revert every AI feature to its built-in default prompt. This action cannot be undone."
          confirmLabel="Reset All Prompts"
          onConfirm={() => {
            updateSetting.mutate({ key: "ai_system_prompts", value: {} });
            toast.success("All prompts reset to system defaults");
          }}
          loading={isPending}
        />
      )}
    </div>
  );
}
