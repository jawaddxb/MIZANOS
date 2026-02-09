"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  productsRepository,
  specificationsRepository,
} from "@/lib/api/repositories";
import type { PillarType, ProjectSourceType } from "@/lib/types";
import type { IntakeFormData } from "@/components/organisms/intake/types";

type SubmitPhase = "idle" | "creating" | "generating" | "done";

const SUBMIT_STEPS = {
  creating: { progress: 20, label: "Creating project..." },
  generating: { progress: 60, label: "Generating specification..." },
  done: { progress: 100, label: "Complete!" },
} as const;

function isTextLikeFile(file: File): boolean {
  const textExtensions = [".md", ".txt", ".json", ".yaml", ".yml", ".csv"];
  return textExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
}

export function useIntakeSubmit() {
  const router = useRouter();
  const [submitPhase, setSubmitPhase] = useState<SubmitPhase>("idle");
  const isSubmitting = submitPhase !== "idle";

  const submitProgress = isSubmitting
    ? SUBMIT_STEPS[submitPhase as keyof typeof SUBMIT_STEPS]?.progress ?? 0
    : 0;

  const submitLabel = isSubmitting
    ? SUBMIT_STEPS[submitPhase as keyof typeof SUBMIT_STEPS]?.label ?? ""
    : "";

  const handleSubmit = useCallback(async (formData: IntakeFormData) => {
    if (!formData.projectName.trim() || !formData.pillar) return;

    try {
      setSubmitPhase("creating");
      const product = await productsRepository.create({
        name: formData.projectName,
        pillar: formData.pillar as PillarType,
        source_type: formData.sourceType as ProjectSourceType,
      });

      setSubmitPhase("generating");
      await persistSources(product.id, formData.sources);

      setSubmitPhase("done");
      toast.success("Project created with specification and QA checklist!");
      setTimeout(() => router.push(`/products/${product.id}`), 500);
    } catch {
      toast.error("Failed to create project");
      setSubmitPhase("idle");
    }
  }, [router]);

  return { isSubmitting, submitPhase, submitProgress, submitLabel, handleSubmit };
}

async function persistSources(productId: string, sources: IntakeFormData["sources"]) {
  for (const doc of sources.documents) {
    if (isTextLikeFile(doc)) {
      try {
        const content = await doc.text();
        if (content.trim()) {
          await specificationsRepository.createSource({
            product_id: productId,
            source_type: "markdown",
            raw_content: content,
            file_name: doc.name,
          });
        }
      } catch { /* skip */ }
    }
  }

  if (sources.markdownContent.trim()) {
    await specificationsRepository.createSource({
      product_id: productId,
      source_type: "markdown",
      raw_content: sources.markdownContent,
    });
  }

  if (sources.pasteContent.trim()) {
    await specificationsRepository.createSource({
      product_id: productId,
      source_type: "paste",
      raw_content: sources.pasteContent,
    });
  }

  for (const note of sources.audioNotes) {
    if (note.transcription) {
      await specificationsRepository.createSource({
        product_id: productId,
        source_type: "audio",
        transcription: note.transcription,
      });
    }
  }

  for (const site of sources.scrapedWebsites) {
    await specificationsRepository.createSource({
      product_id: productId,
      source_type: "website",
      raw_content: site.markdown,
      url: site.url,
      branding: site.branding ? JSON.stringify(site.branding) : undefined,
    });
  }

  if (sources.githubData) {
    await specificationsRepository.createSource({
      product_id: productId,
      source_type: "github",
      url: sources.githubData.repositoryUrl,
      raw_content: JSON.stringify({
        repoInfo: sources.githubData.repoInfo,
        techStack: sources.githubData.techStack,
        branch: sources.githubData.branch,
      }),
    });
  }
}
