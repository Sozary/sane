"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Lightbulb } from "lucide-react";

export interface PeriodAnalysisData {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  advice: string[];
}

interface PeriodAnalysisResultProps {
  data: PeriodAnalysisData;
}

export function PeriodAnalysisResult({ data }: PeriodAnalysisResultProps) {
  const sections = [
    {
      key: "summary",
      content: (
        <Card>
          <CardHeader>
            <CardTitle>Résumé</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{data.summary}</p>
          </CardContent>
        </Card>
      ),
    },
    ...(data.strengths.length > 0
      ? [
          {
            key: "strengths",
            content: (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    Points forts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {data.strengths.map((item, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-emerald-600 mt-0.5">•</span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ),
          },
        ]
      : []),
    ...(data.weaknesses.length > 0
      ? [
          {
            key: "weaknesses",
            content: (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="size-4 text-amber-600" />
                    À améliorer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {data.weaknesses.map((item, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-amber-600 mt-0.5">•</span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ),
          },
        ]
      : []),
    ...(data.advice.length > 0
      ? [
          {
            key: "advice",
            content: (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="size-4" style={{ color: "#A4B465" }} />
                    Conseils
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {data.advice.map((item, i) => (
                      <li key={i} className="flex gap-2">
                        <span style={{ color: "#A4B465" }} className="mt-0.5">•</span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
      {sections.map((section, index) => (
        <div
          key={section.key}
          className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-backwards"
          style={{ animationDelay: `${index * 80}ms` }}
        >
          {section.content}
        </div>
      ))}
    </div>
  );
}
