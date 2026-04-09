import React from 'react';
import { Brain, Sparkles, TriangleAlert, TrendingUp, CircleDashed, ArrowRight } from 'lucide-react';

type InsightTone = 'critical' | 'watch' | 'positive' | 'info';

export interface AIInsightItem {
  title: string;
  description: string;
  action?: string;
  metric?: string;
  label?: string;
  tone?: InsightTone;
}

interface AIInsightsPanelProps {
  title?: string;
  summary: string;
  insights: AIInsightItem[];
  footer?: string;
}

const toneStyles: Record<InsightTone, { card: string; badge: string; icon: React.ReactNode }> = {
  critical: {
    card: 'border-red-200 bg-red-50/80',
    badge: 'bg-red-100 text-red-700',
    icon: <TriangleAlert className="h-4 w-4 text-red-600" />,
  },
  watch: {
    card: 'border-amber-200 bg-amber-50/80',
    badge: 'bg-amber-100 text-amber-700',
    icon: <CircleDashed className="h-4 w-4 text-amber-600" />,
  },
  positive: {
    card: 'border-emerald-200 bg-emerald-50/80',
    badge: 'bg-emerald-100 text-emerald-700',
    icon: <TrendingUp className="h-4 w-4 text-emerald-600" />,
  },
  info: {
    card: 'border-sky-200 bg-sky-50/80',
    badge: 'bg-sky-100 text-sky-700',
    icon: <Sparkles className="h-4 w-4 text-sky-600" />,
  },
};

const toneLabel: Record<InsightTone, string> = {
  critical: 'Urgent',
  watch: 'Watch',
  positive: 'Good',
  info: 'Signal',
};

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({
  title = 'AI Insights',
  summary,
  insights,
  footer,
}) => {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_40%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(30,41,59,0.94))] px-6 py-5 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">
              <Brain className="h-4 w-4" />
              Decision Support
            </div>
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-slate-200">{summary}</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100 ring-1 ring-inset ring-emerald-300/20">
            <Sparkles className="h-3.5 w-3.5" />
            Live pattern readout
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 p-6 xl:grid-cols-3">
        {insights.map((insight) => {
          const currentTone = insight.tone || 'info';
          const tone = toneStyles[currentTone];
          return (
            <article key={`${insight.title}-${insight.metric || insight.description}`} className={`rounded-2xl border p-4 ${tone.card}`}>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex items-center gap-2">
                  <div className="rounded-full bg-white/80 p-2 shadow-sm">
                    {tone.icon}
                  </div>
                  <div className="min-w-0">
                    {insight.label && (
                      <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        {insight.label}
                      </div>
                    )}
                    <h3 className="text-sm font-semibold text-slate-900">{insight.title}</h3>
                    <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${tone.badge}`}>
                      {toneLabel[currentTone]}
                    </span>
                  </div>
                </div>
                {insight.metric && (
                  <div className="text-right text-lg font-semibold text-slate-900">{insight.metric}</div>
                )}
              </div>
              <p className="text-sm leading-5 text-slate-700">{insight.description}</p>
              {insight.action && (
                <div className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                  <ArrowRight className="h-4 w-4" />
                  <span>Next: {insight.action}</span>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {footer && (
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 text-xs text-slate-500">
          {footer}
        </div>
      )}
    </section>
  );
};
