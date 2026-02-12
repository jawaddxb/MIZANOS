"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/display/Card";
import { Badge } from "@/components/atoms/display/Badge";
import { ChevronRight, Clock, AlertCircle } from "lucide-react";
import type { JsonValue } from "@/lib/types";

export interface SpecContent {
  // Old format
  overview?: string;
  technicalRequirements?: string[];
  features?: Array<{ name: string; priority: string; description?: string }> | string[];
  timeline?: {
    estimatedDuration?: string;
    phases?: Array<{ name: string; duration: string; deliverables?: string[] }>;
  };
  qaChecklist?: Array<{ category: string; title: string }> | string[];
  // New format
  summary?: string;
  functionalSpec?: {
    userStories?: string[];
    businessRules?: string[];
    acceptanceCriteria?: string[];
  };
  technicalSpec?: {
    architecture?: string;
    dataModels?: string[];
    integrations?: string[];
    nonFunctionalRequirements?: string[];
  };
  techStack?: string[];
}

export function parseSpecContent(content: JsonValue | undefined): SpecContent {
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return {};
  }
  return content as unknown as SpecContent;
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function LabeledSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-medium mb-2">{title}</h4>
      {children}
    </div>
  );
}

export function SpecContentSections({ content }: { content: SpecContent }) {
  return (
    <>
      {(content.overview || content.summary) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {content.overview || content.summary}
            </p>
          </CardContent>
        </Card>
      )}

      {content.functionalSpec && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Functional Specification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {content.functionalSpec.userStories && content.functionalSpec.userStories.length > 0 && (
              <LabeledSection title="User Stories">
                <BulletList items={content.functionalSpec.userStories} />
              </LabeledSection>
            )}
            {content.functionalSpec.businessRules && content.functionalSpec.businessRules.length > 0 && (
              <LabeledSection title="Business Rules">
                <BulletList items={content.functionalSpec.businessRules} />
              </LabeledSection>
            )}
            {content.functionalSpec.acceptanceCriteria && content.functionalSpec.acceptanceCriteria.length > 0 && (
              <LabeledSection title="Acceptance Criteria">
                <BulletList items={content.functionalSpec.acceptanceCriteria} />
              </LabeledSection>
            )}
          </CardContent>
        </Card>
      )}

      {content.technicalSpec && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Technical Specification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {content.technicalSpec.architecture && (
              <LabeledSection title="Architecture">
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {content.technicalSpec.architecture}
                </p>
              </LabeledSection>
            )}
            {content.technicalSpec.dataModels && content.technicalSpec.dataModels.length > 0 && (
              <LabeledSection title="Data Models">
                <BulletList items={content.technicalSpec.dataModels} />
              </LabeledSection>
            )}
            {content.technicalSpec.integrations && content.technicalSpec.integrations.length > 0 && (
              <LabeledSection title="Integrations">
                <BulletList items={content.technicalSpec.integrations} />
              </LabeledSection>
            )}
            {content.technicalSpec.nonFunctionalRequirements && content.technicalSpec.nonFunctionalRequirements.length > 0 && (
              <LabeledSection title="Non-Functional Requirements">
                <BulletList items={content.technicalSpec.nonFunctionalRequirements} />
              </LabeledSection>
            )}
          </CardContent>
        </Card>
      )}

      {content.techStack && content.techStack.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tech Stack</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {content.techStack.map((tech, i) => (
                <Badge key={i} variant="secondary">{tech}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {content.features && content.features.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Features</CardTitle>
          </CardHeader>
          <CardContent>
            <BulletList
              items={content.features.map((f) => (typeof f === "string" ? f : f.name))}
            />
          </CardContent>
        </Card>
      )}

      {content.technicalRequirements && content.technicalRequirements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Technical Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <BulletList items={content.technicalRequirements} />
          </CardContent>
        </Card>
      )}

      {content.timeline && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {content.timeline.estimatedDuration && (
              <p className="text-sm text-muted-foreground mb-4">
                Estimated Duration:{" "}
                <span className="font-medium text-foreground">
                  {content.timeline.estimatedDuration}
                </span>
              </p>
            )}
            <div className="space-y-4">
              {content.timeline.phases?.map((phase, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {index + 1}
                    </div>
                    {index < (content.timeline?.phases?.length ?? 0) - 1 && (
                      <div className="w-0.5 h-full bg-border mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-foreground">{phase.name}</h4>
                      <Badge variant="secondary" className="text-xs">{phase.duration}</Badge>
                    </div>
                    <ul className="space-y-1">
                      {phase.deliverables?.map((d, i) => (
                        <li key={i} className="text-sm text-muted-foreground">&bull; {d}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {content.qaChecklist && content.qaChecklist.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Suggested QA Checks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {content.qaChecklist.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-sm p-2 rounded-lg bg-secondary/30"
                >
                  {typeof item === "string" ? (
                    <span className="text-muted-foreground">{item}</span>
                  ) : (
                    <>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {item.category}
                      </Badge>
                      <span className="text-muted-foreground">{item.title}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
