import type { IntakeFormData } from "./types";

export function buildSourceSummary(sources: IntakeFormData["sources"]): string {
  const parts: string[] = [];
  if (sources.pasteContent.trim()) {
    parts.push(`Pasted content:\n${sources.pasteContent.slice(0, 2000)}`);
  }
  if (sources.markdownContent.trim()) {
    parts.push(`Markdown notes:\n${sources.markdownContent.slice(0, 2000)}`);
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
    siteInfo += site.markdown?.slice(0, 1000) || site.aiSummary || "(no content)";
    parts.push(siteInfo);
  }
  for (const note of sources.audioNotes) {
    if (note.transcription) {
      parts.push(`Audio note transcription:\n${note.transcription}`);
    }
  }
  if (sources.documents.length > 0) {
    parts.push(`Uploaded documents: ${sources.documents.map((d) => d.name).join(", ")}`);
  }
  if (sources.githubData) {
    parts.push(`GitHub repository: ${sources.githubData.repositoryUrl}`);
  }
  return parts.join("\n\n");
}
