import {
  Activity,
  BrainCircuit,
  FileText,
  TrendingDown,
  TrendingUp,
  Minus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buildEntityIntelligenceContext } from "../../engines/entityIntelligenceEngine";

const CAPABILITY_LABELS = {
  feed: "Feed",
  health: "Health",
  weight: "Weight",
  egg: "Egg production",
  breeding: "Breeding",
  milk: "Milk",
  harvest: "Harvest",
};

function formatEventType(type) {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function EntityIntelligence({ entity, events = [] }) {
  const intelligenceContext = buildEntityIntelligenceContext({
    entity,
    events,
  });
  const capabilities = intelligenceContext.species.capabilities ?? {};

  const enabledCapabilities = Object.keys(capabilities).filter(
    (key) => capabilities[key] !== false,
  );

  const capabilityCounts = intelligenceContext.analysis.activitySummary;
  const trendSummary = intelligenceContext.analysis.trendSummary;
  const capabilityTrends = trendSummary.capabilityTrends ?? [];
  const trendConfig = {
    increasing: {
      label: "Activity is increasing",
      description:
        "More activity has been recorded in the last 7 days than in the previous 7 days.",
      icon: TrendingUp,
    },
    decreasing: {
      label: "Activity is decreasing",
      description:
        "Less activity has been recorded in the last 7 days than in the previous 7 days.",
      icon: TrendingDown,
    },
    stable: {
      label: "Activity is stable",
      description:
        "Activity levels are similar across the two most recent 7-day periods.",
      icon: Minus,
    },
    "no-data": {
      label: "Not enough activity data",
      description:
        "Record some activities to start seeing trends for this entity.",
      icon: Activity,
    },
  };

  const currentTrend =
    trendConfig[trendSummary.trend] ?? trendConfig["no-data"];

  const TrendIcon = currentTrend.icon;

  const activityItems = enabledCapabilities
    .map((key) => ({
      key,
      label: CAPABILITY_LABELS[key] ?? formatEventType(key),
      count: capabilityCounts[key] ?? 0,
    }))
    .sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...activityItems.map((item) => item.count), 1);

  const analysis = intelligenceContext.analysis;

  const observations = analysis.observations;

  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <BrainCircuit className="size-4" />
        </div>

        <div>
          <h2 className="text-base font-semibold">Entity intelligence</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            A data-based summary of what is currently recorded for this entity.
          </p>
        </div>
      </div>

      <Card className="border-border/70 bg-card shadow-sm">
        <CardContent className="space-y-6 p-5">
          <div className="space-y-4">
            <div className="rounded-xl border border-primary/15 bg-primary/[0.035] p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BrainCircuit className="size-4" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-primary">
                    Farm intelligence
                  </p>

                  {analysis.detectedPurposes.length > 0 ? (
                    <>
                      <p className="mt-1.5 text-sm font-medium leading-6 text-foreground">
                        Primary focus: {analysis.detectedPurposes.join(", ")}
                      </p>

                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        This focus was inferred from the registration note and
                        the capabilities configured for this entity.
                      </p>
                    </>
                  ) : (
                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                      There is not enough contextual information yet to
                      determine a specific operational focus for this entity.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {intelligenceContext.entity.notes && (
              <div className="rounded-xl border border-border/70 bg-muted/[0.18] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground">
                    <FileText className="size-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      Registration context
                    </p>

                    <p className="mt-1.5 text-sm leading-6 text-foreground">
                      {intelligenceContext.entity.notes}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Activity overview</p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Activity mapped to the capabilities of this entity.
                </p>
              </div>

              <Activity className="size-4 text-muted-foreground" />
            </div>

            {activityItems.length > 0 ? (
              <div className="mt-4 space-y-3">
                {activityItems.map((item) => (
                  <div key={item.key} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-medium text-foreground">
                        {item.label}
                      </span>

                      <span className="text-muted-foreground">
                        {item.count}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{
                          width: `${(item.count / maxCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-border px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No capabilities are configured for this species.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-border/60 pt-5">
            <p className="text-sm font-medium">Key observations</p>

            <ul className="mt-3 space-y-2">
              {observations.map((observation, index) => (
                <li
                  key={index}
                  className="flex gap-2 text-sm leading-6 text-muted-foreground"
                >
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />

                  <span>{observation}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <TrendIcon className="size-4" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Activity trend
              </p>

              <p className="mt-1 text-sm font-semibold text-foreground">
                {currentTrend.label}
              </p>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {currentTrend.description}
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border/70 bg-muted/[0.18] p-3">
                  <p className="text-xs text-muted-foreground">Last 7 days</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {trendSummary.recentEventCount}
                  </p>
                </div>

                <div className="rounded-lg border border-border/70 bg-muted/[0.18] p-3">
                  <p className="text-xs text-muted-foreground">
                    Previous 7 days
                  </p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {trendSummary.previousEventCount}
                  </p>
                </div>

                <div className="rounded-lg border border-border/70 bg-muted/[0.18] p-3">
                  <p className="text-xs text-muted-foreground">
                    Last recorded activity
                  </p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {trendSummary.daysSinceLastEvent == null
                      ? "—"
                      : `${trendSummary.daysSinceLastEvent}d ago`}
                  </p>
                </div>
              </div>
              {capabilityTrends.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    By activity type
                  </p>

                  <div className="space-y-2">
                    {capabilityTrends.map((item) => {
                      const config =
                        trendConfig[item.trend] ?? trendConfig.stable;
                      const Icon = config.icon;

                      return (
                        <div
                          key={item.capability}
                          className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/[0.18] px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {CAPABILITY_LABELS[item.capability] ??
                                item.capability}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {item.inactive
                                ? "No activity recorded in the last 7 days"
                                : `${item.recentCount} recent · ${item.previousCount} previous`}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                            <Icon className="size-3.5" />
                            <span className="capitalize">
                              {item.inactive ? "Inactive" : item.trend}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export default EntityIntelligence;
