import { specificationsRepository } from "@/lib/api/repositories";
import type { IntakeFormData } from "./types";

const TEXT_EXTENSIONS = [".md", ".txt", ".json", ".yaml", ".yml", ".csv"];
const MAX_DOC_CHARS = 10000;

export function isTextLikeFile(file: File): boolean {
  return TEXT_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

function fileToBase64DataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function extractDocumentText(file: File): Promise<string> {
  try {
    if (isTextLikeFile(file)) {
      const text = await file.text();
      return text.slice(0, MAX_DOC_CHARS);
    }
    const text = await specificationsRepository.extractText(file);
    return text.slice(0, MAX_DOC_CHARS);
  } catch {
    return "";
  }
}

export interface SourceSummaryResult {
  text: string;
  images: string[];
}

export async function buildSourceSummary(
  sources: IntakeFormData["sources"],
): Promise<SourceSummaryResult> {
  const parts: string[] = [];
  const images: string[] = [];

  if (sources.pasteContent.trim()) {
    parts.push(`Pasted content:\n${sources.pasteContent.slice(0, 6000)}`);
  }
  if (sources.markdownContent.trim()) {
    parts.push(`Markdown notes:\n${sources.markdownContent.slice(0, 6000)}`);
  }
  for (const site of sources.scrapedWebsites) {
    let siteInfo = `Website (${site.url}):\n`;
    if (site.analysis) {
      siteInfo += `Product: ${site.analysis.productName}\n`;
      siteInfo += `Description: ${site.analysis.description}\n`;
      if (site.analysis.features.length > 0) siteInfo += `Features: ${site.analysis.features.join("; ")}\n`;
      if (site.analysis.targetAudience) siteInfo += `Target Audience: ${site.analysis.targetAudience}\n`;
      if (site.analysis.techIndicators.length > 0) siteInfo += `Tech: ${site.analysis.techIndicators.join(", ")}\n`;
    }
    siteInfo += site.markdown?.slice(0, 3000) || site.aiSummary || "(no content)";
    parts.push(siteInfo);
  }
  for (const note of sources.audioNotes) {
    if (note.transcription) {
      parts.push(`Audio note transcription:\n${note.transcription}`);
    }
  }

  for (const doc of sources.documents) {
    if (isImageFile(doc)) {
      try {
        const dataUrl = await fileToBase64DataUrl(doc);
        images.push(dataUrl);
        parts.push(`Uploaded image: ${doc.name}`);
      } catch {
        parts.push(`Uploaded image (could not encode): ${doc.name}`);
      }
    } else {
      const text = await extractDocumentText(doc);
      if (text.trim()) {
        parts.push(`Document "${doc.name}":\n${text}`);
      } else {
        parts.push(`Uploaded document: ${doc.name} (no text extracted)`);
      }
    }
  }

  if (sources.githubData) {
    parts.push(`GitHub repository: ${sources.githubData.repositoryUrl}`);
  }

  return { text: parts.join("\n\n"), images };
}
