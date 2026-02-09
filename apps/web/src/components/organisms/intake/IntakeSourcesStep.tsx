"use client";

import * as React from "react";

import { FileText, Mic, Code, ClipboardPaste, Globe, Github, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/atoms/layout/Tabs";
import { BaseTextarea } from "@/components/atoms/inputs/BaseTextarea";
import { BaseLabel } from "@/components/atoms/inputs/BaseLabel";
import type { AudioNote, ScrapedWebsite, GitHubData } from "./types";
import { DocumentUpload } from "./DocumentUpload";
import { AudioNotes } from "./AudioNotes";
import { MarkdownInput } from "./MarkdownInput";
import { PastePreview } from "./PastePreview";
import { WebsiteScraper } from "./WebsiteScraper";
import { GitHubRepoInput } from "./GitHubRepoInput";

interface IntakeSourcesStepProps {
  documents: File[];
  onDocumentsChange: (files: File[]) => void;
  audioNotes: AudioNote[];
  onAudioNotesChange: (notes: AudioNote[]) => void;
  markdownContent: string;
  onMarkdownContentChange: (value: string) => void;
  pasteContent: string;
  onPasteContentChange: (value: string) => void;
  scrapedWebsites: ScrapedWebsite[];
  onScrapedWebsitesChange: (sites: ScrapedWebsite[]) => void;
  githubData: GitHubData | null;
  onGitHubDataChange: (data: GitHubData | null) => void;
}

const SOURCE_TABS: Array<{ id: string; label: string; icon: React.ElementType }> = [
  { id: "documents", label: "Documents", icon: FileText },
  { id: "audio", label: "Audio", icon: Mic },
  { id: "markdown", label: "Markdown", icon: Code },
  { id: "paste", label: "Paste", icon: ClipboardPaste },
  { id: "website", label: "Website", icon: Globe },
  { id: "github", label: "GitHub", icon: Github },
];

function getTabCount(
  id: string,
  props: IntakeSourcesStepProps,
): number {
  switch (id) {
    case "documents": return props.documents.length;
    case "audio": return props.audioNotes.length;
    case "markdown": return props.markdownContent.trim() ? 1 : 0;
    case "paste": return props.pasteContent.trim() ? 1 : 0;
    case "website": return props.scrapedWebsites.length;
    case "github": return props.githubData ? 1 : 0;
    default: return 0;
  }
}

export function IntakeSourcesStep(props: IntakeSourcesStepProps) {
  const {
    documents, onDocumentsChange, audioNotes, onAudioNotesChange,
    markdownContent, onMarkdownContentChange, pasteContent, onPasteContentChange,
    scrapedWebsites, onScrapedWebsitesChange, githubData, onGitHubDataChange,
  } = props;

  const [activeTab, setActiveTab] = React.useState("documents");

  const hasAny = SOURCE_TABS.some((t) => getTabCount(t.id, props) > 0);

  return (
    <Card className={cn(!hasAny && "border-destructive/30")}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              Specification Sources
              <Badge variant="destructive" className="text-xs">Required</Badge>
            </CardTitle>
            <CardDescription>Add at least one source to continue</CardDescription>
          </div>
          {hasAny && <CheckCircle2 className="h-5 w-5 text-status-healthy" />}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 grid w-full grid-cols-6">
            {SOURCE_TABS.map((t) => {
              const count = getTabCount(t.id, props);
              return (
                <TabsTrigger key={t.id} value={t.id} className="flex items-center gap-2">
                  <t.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.label}</span>
                  {count > 0 && (
                    <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      {count}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="documents">
            <DocumentUpload onFilesChange={onDocumentsChange} />
          </TabsContent>

          <TabsContent value="audio">
            <AudioNotes onNotesChange={onAudioNotesChange} />
          </TabsContent>

          <TabsContent value="markdown">
            <MarkdownInput value={markdownContent} onChange={onMarkdownContentChange} />
          </TabsContent>

          <TabsContent value="paste">
            <div className="space-y-3">
              <BaseLabel>Paste Project Information</BaseLabel>
              <BaseTextarea
                className="min-h-[200px] resize-y"
                placeholder="Paste requirements, emails, meeting notes, etc."
                value={pasteContent}
                onChange={(e) => onPasteContentChange(e.target.value)}
              />
              <PastePreview content={pasteContent} />
            </div>
          </TabsContent>

          <TabsContent value="website">
            <WebsiteScraper
              websites={scrapedWebsites}
              onWebsitesChange={onScrapedWebsitesChange}
            />
          </TabsContent>

          <TabsContent value="github">
            <GitHubRepoInput
              githubData={githubData}
              onGitHubDataChange={onGitHubDataChange}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
