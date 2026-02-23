"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { BaseButton } from "@/components/atoms/buttons/BaseButton";
import { BaseLabel } from "@/components/atoms/inputs/BaseLabel";
import { BaseTextarea } from "@/components/atoms/inputs/BaseTextarea";
import { ConfirmDialog } from "@/components/molecules/feedback/ConfirmDialog";
import { useUpdateOrgSetting } from "@/hooks/mutations/useOrgSettingMutations";

interface PromptEditorProps {
  promptKey: string;
  label: string;
  value: string;
  defaultValue: string;
  allPrompts: Record<string, string>;
  isPending: boolean;
}

export function PromptEditor({
  promptKey,
  label,
  value,
  defaultValue,
  allPrompts,
  isPending,
}: PromptEditorProps) {
  const updateSetting = useUpdateOrgSetting();
  const isCustomized = value !== "" && value !== defaultValue;
  const displayValue = isCustomized ? value : defaultValue;
  const [local, setLocal] = useState(displayValue);
  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const dirty = local !== displayValue;

  const save = () => {
    updateSetting.mutate({
      key: "ai_system_prompts",
      value: { ...allPrompts, [promptKey]: local },
    });
  };

  const resetToDefault = () => {
    const without = { ...allPrompts };
    delete without[promptKey];
    updateSetting.mutate({ key: "ai_system_prompts", value: without });
    setLocal(defaultValue);
  };

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BaseLabel htmlFor={`prompt-${promptKey}`}>{label}</BaseLabel>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
            {isCustomized ? (
              <X className="h-2.5 w-2.5" />
            ) : (
              <Check className="h-2.5 w-2.5" />
            )}
            System Default
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
            {isCustomized ? (
              <Check className="h-2.5 w-2.5" />
            ) : (
              <X className="h-2.5 w-2.5" />
            )}
            Customized
          </span>
        </div>
        {isCustomized && (
          <BaseButton
            variant="ghost"
            size="sm"
            onClick={() => setConfirmReset(true)}
            disabled={isPending}
          >
            Reset to Default
          </BaseButton>
        )}
      </div>
      <BaseTextarea
        id={`prompt-${promptKey}`}
        rows={4}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        disabled={isPending}
      />
      {dirty && (
        <BaseButton
          size="sm"
          onClick={() => setConfirmSave(true)}
          disabled={isPending}
        >
          Save Prompt
        </BaseButton>
      )}
      {confirmSave && (
        <ConfirmDialog
          open={confirmSave}
          onOpenChange={setConfirmSave}
          title="Save Custom Prompt"
          description={`This will override the system default prompt for "${label}". The AI will use your custom prompt for all future requests.`}
          confirmLabel="Save Prompt"
          onConfirm={save}
          loading={isPending}
        />
      )}
      {confirmReset && (
        <ConfirmDialog
          open={confirmReset}
          onOpenChange={setConfirmReset}
          title="Reset to System Default"
          description={`This will discard your custom prompt for "${label}" and revert to the built-in system default. This action cannot be undone.`}
          confirmLabel="Reset to Default"
          onConfirm={resetToDefault}
          loading={isPending}
        />
      )}
    </div>
  );
}
