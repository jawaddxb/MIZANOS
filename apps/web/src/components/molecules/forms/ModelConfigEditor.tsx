"use client";

import { useState, useCallback } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { BaseButton } from "@/components/atoms/buttons/BaseButton";
import { BaseInput } from "@/components/atoms/inputs/BaseInput";
import { BaseLabel } from "@/components/atoms/inputs/BaseLabel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/inputs/BaseSelect";
import { ModelCombobox } from "@/components/molecules/forms/ModelCombobox";
import { ConfirmDialog } from "@/components/molecules/feedback/ConfirmDialog";
import { useUpdateOrgSetting } from "@/hooks/mutations/useOrgSettingMutations";
import { settingsRepository } from "@/lib/api/repositories";

export interface ModelConfig {
  provider: string;
  model: string;
  temperature: number;
  max_tokens: number;
}

interface ModelConfigEditorProps {
  config: ModelConfig;
  defaultConfig: ModelConfig;
  isPending: boolean;
}

function FieldStatus(props: {
  defaultLabel: string; isChanged: boolean; onReset: () => void; disabled: boolean;
}) {
  const { defaultLabel, isChanged, onReset, disabled } = props;
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-px text-[9px] font-medium text-emerald-700">
          {isChanged ? <X className="h-2 w-2" /> : <Check className="h-2 w-2" />}
          Default{!isChanged ? "" : `: ${defaultLabel}`}
        </span>
        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-px text-[9px] font-medium text-amber-700">
          {isChanged ? <Check className="h-2 w-2" /> : <X className="h-2 w-2" />}
          Custom
        </span>
      </div>
      {isChanged && (
        <button
          type="button"
          onClick={onReset}
          disabled={disabled}
          className="flex items-center gap-0.5 text-[10px] text-primary hover:underline disabled:opacity-50"
        >
          <RotateCcw className="h-2.5 w-2.5" />
          Reset
        </button>
      )}
    </div>
  );
}

export function ModelConfigEditor({
  config,
  defaultConfig,
  isPending,
}: ModelConfigEditorProps) {
  const updateSetting = useUpdateOrgSetting();
  const [local, setLocal] = useState(config);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const dirty = JSON.stringify(local) !== JSON.stringify(config);
  const modelChanged =
    local.model !== config.model || local.provider !== config.provider;
  const isCustomized = JSON.stringify(config) !== JSON.stringify(defaultConfig);

  const save = useCallback(async () => {
    if (modelChanged) {
      setVerifying(true);
      setVerifyError(null);
      try {
        await settingsRepository.verifyAiModel(local.provider, local.model);
        toast.success("Model verified successfully");
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Model verification failed";
        let detail = msg;
        if (err && typeof err === "object" && "response" in err) {
          const resp = (err as { response?: { data?: { detail?: string } } })
            .response;
          if (resp?.data?.detail) detail = resp.data.detail;
        }
        setVerifyError(detail);
        toast.error(`Model verification failed: ${detail}`);
        setVerifying(false);
        return;
      } finally {
        setVerifying(false);
      }
    }
    updateSetting.mutate({
      key: "ai_model_config",
      value: local as unknown as Record<string, unknown>,
    });
    setVerifyError(null);
  }, [local, config, modelChanged, updateSetting]);

  const resetField = (field: keyof ModelConfig) => {
    setLocal({ ...local, [field]: defaultConfig[field] });
  };

  const resetAll = useCallback(() => {
    setLocal(defaultConfig);
    updateSetting.mutate({
      key: "ai_model_config",
      value: defaultConfig as unknown as Record<string, unknown>,
    });
    setVerifyError(null);
    toast.success("Model parameters reset to system defaults");
  }, [defaultConfig, updateSetting]);

  const busy = isPending || verifying;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          These settings control which AI model is used across all platform
          features including chat, spec generation, QA checklists, and system
          document generation.
        </p>
        {isCustomized && (
          <BaseButton
            variant="ghost"
            size="sm"
            onClick={() => setConfirmReset(true)}
            disabled={busy}
            className="shrink-0 gap-1.5 text-xs"
          >
            <RotateCcw className="h-3 w-3" />
            Load System Defaults
          </BaseButton>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <BaseLabel htmlFor="ai-provider">Provider</BaseLabel>
          <Select
            value={local.provider}
            onValueChange={(v) => setLocal({ ...local, provider: v })}
            disabled={busy}
          >
            <SelectTrigger id="ai-provider">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openrouter">OpenRouter</SelectItem>
              <SelectItem value="openai">OpenAI</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            OpenRouter gives access to models from multiple providers
            (Anthropic, OpenAI, Google, etc.) via a single API key.
          </p>
          <FieldStatus
            defaultLabel={defaultConfig.provider}
            isChanged={local.provider !== defaultConfig.provider}
            onReset={() => resetField("provider")}
            disabled={busy}
          />
        </div>

        <div className="space-y-1.5">
          <BaseLabel>Model</BaseLabel>
          <ModelCombobox
            value={local.model}
            provider={local.provider}
            onValueChange={(v) => {
              setLocal({ ...local, model: v });
              setVerifyError(null);
            }}
            disabled={busy}
          />
          <p className="text-[11px] text-muted-foreground">
            The model ID used for all AI calls. Changing this will trigger a
            test call to verify the model is accessible.
          </p>
          {verifyError && (
            <p className="text-[11px] font-medium text-destructive">
              {verifyError}
            </p>
          )}
          <FieldStatus
            defaultLabel={defaultConfig.model}
            isChanged={local.model !== defaultConfig.model}
            onReset={() => resetField("model")}
            disabled={busy}
          />
        </div>

        <div className="space-y-1.5">
          <BaseLabel htmlFor="ai-temp">Temperature</BaseLabel>
          <BaseInput
            id="ai-temp"
            type="number"
            min={0}
            max={2}
            step={0.1}
            value={local.temperature}
            onChange={(e) =>
              setLocal({
                ...local,
                temperature: parseFloat(e.target.value) || 0,
              })
            }
            disabled={busy}
          />
          <p className="text-[11px] text-muted-foreground">
            Controls randomness (0 = deterministic, 2 = very creative).
            Recommended: 0.7 for balanced output.
          </p>
          <FieldStatus
            defaultLabel={String(defaultConfig.temperature)}
            isChanged={local.temperature !== defaultConfig.temperature}
            onReset={() => resetField("temperature")}
            disabled={busy}
          />
        </div>

        <div className="space-y-1.5">
          <BaseLabel htmlFor="ai-tokens">Max Tokens</BaseLabel>
          <BaseInput
            id="ai-tokens"
            type="number"
            min={1}
            value={local.max_tokens}
            onChange={(e) =>
              setLocal({
                ...local,
                max_tokens: parseInt(e.target.value, 10) || 4096,
              })
            }
            disabled={busy}
          />
          <p className="text-[11px] text-muted-foreground">
            Maximum number of tokens the model can generate per response.
            Higher values allow longer outputs but cost more.
          </p>
          <FieldStatus
            defaultLabel={String(defaultConfig.max_tokens)}
            isChanged={local.max_tokens !== defaultConfig.max_tokens}
            onReset={() => resetField("max_tokens")}
            disabled={busy}
          />
        </div>
      </div>

      {dirty && (
        <BaseButton
          size="sm"
          onClick={() => setConfirmSave(true)}
          disabled={busy}
        >
          {verifying ? "Verifying model..." : "Save Model Config"}
        </BaseButton>
      )}
      {confirmSave && (
        <ConfirmDialog
          open={confirmSave}
          onOpenChange={setConfirmSave}
          title="Save Model Configuration"
          description="This will update the AI model settings used across all platform features. If the model has changed, a verification call will be made first."
          confirmLabel="Save Config"
          onConfirm={save}
          loading={busy}
        />
      )}
      {confirmReset && (
        <ConfirmDialog
          open={confirmReset}
          onOpenChange={setConfirmReset}
          title="Load System Defaults"
          description="This will reset all model parameters (provider, model, temperature, max tokens) back to the built-in system defaults. Any custom configuration will be lost."
          confirmLabel="Reset to Defaults"
          onConfirm={resetAll}
          loading={busy}
        />
      )}
    </div>
  );
}
