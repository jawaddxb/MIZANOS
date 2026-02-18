"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  marketingRepository,
  productsRepository,
  specificationsRepository,
} from "@/lib/api/repositories";
import type { PillarType, ProjectSourceType } from "@/lib/types";
import type { IntakeFormData } from "@/components/organisms/intake/types";

type SubmitPhase = "idle" | "creating" | "generating" | "saving-spec" | "done";

const SUBMIT_STEPS = {
  creating: { progress: 20, label: "Creating project..." },
  generating: { progress: 50, label: "Saving sources..." },
  "saving-spec": { progress: 80, label: "Saving specification..." },
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
      await autoPopulateMarketing(product.id, formData.sources);
      await autoSetLogo(product.id, formData.sources);

      if (formData.generatedSpec) {
        setSubmitPhase("saving-spec");
        await specificationsRepository.createSpecification({
          product_id: product.id,
          content: formData.generatedSpec as unknown as Record<string, unknown>,
        });
      }

      setSubmitPhase("done");
      toast.success("Project created with specification and QA checklist!");
      setTimeout(() => router.push(`/projects/${product.id}`), 500);
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
      } catch (err) {
        console.warn(`Failed to read text file ${doc.name}:`, err);
      }
    } else {
      await specificationsRepository.createSource({
        product_id: productId,
        source_type: "document",
        file_name: doc.name,
        raw_content: `[Binary file: ${doc.name}, ${doc.size} bytes, type: ${doc.type}]`,
      });
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
      branding: site.branding ?? undefined,
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

async function autoPopulateMarketing(productId: string, sources: IntakeFormData["sources"]) {
  const websites = sources.scrapedWebsites.filter((s) => s.marketing);
  if (websites.length === 0) return;

  // Collect and deduplicate domains
  const domainMap = new Map<string, { domain_name: string; ssl_status?: string; is_secured?: boolean }>();
  for (const site of websites) {
    const d = site.marketing!.domain;
    if (d.domain && !domainMap.has(d.domain.toLowerCase())) {
      domainMap.set(d.domain.toLowerCase(), {
        domain_name: d.domain,
        ssl_status: d.ssl_status,
        is_secured: d.is_secured,
      });
    }
  }

  // Collect and deduplicate social handles
  const handleMap = new Map<string, { platform: string; handle: string; url?: string }>();
  for (const site of websites) {
    for (const h of site.marketing!.socialHandles) {
      const key = `${h.platform.toLowerCase()}:${h.handle.toLowerCase()}`;
      if (!handleMap.has(key)) {
        handleMap.set(key, { platform: h.platform, handle: h.handle, url: h.url ?? undefined });
      }
    }
  }

  const domains = Array.from(domainMap.values());
  const handles = Array.from(handleMap.values());

  if (domains.length === 0 && handles.length === 0) return;

  try {
    await marketingRepository.autoPopulate({
      product_id: productId,
      domains,
      social_handles: handles,
    });
  } catch (err) {
    console.warn("Auto-populate marketing failed:", err);
  }
}

async function autoSetLogo(productId: string, sources: IntakeFormData["sources"]) {
  const logo = sources.scrapedWebsites.find((s) => s.logo)?.logo;
  if (!logo) return;

  try {
    await productsRepository.update(productId, { logo_url: logo });
  } catch (err) {
    console.warn("Auto-set logo failed:", err);
  }
}
