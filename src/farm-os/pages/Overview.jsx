import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";
import { supabase } from "../lib/supabaseClient";
import { localDateISO } from "../lib/localDate";
import { computeStock } from "../engines/inventoryEngine";
import {
  aggregateDailyConsumption,
  computeDailyRate,
  daysRemaining,
  classifyAlert,
  estimateMonthlyRequirement,
} from "../engines/feedForecastEngine";
import { classifyTask } from "../engines/taskEngine";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Package,
  Sprout,
  Boxes,
  Clock,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const activityChartConfig = {
  livestock: {
    label: "Livestock",
    color: "var(--chart-1)",
  },
  crops: {
    label: "Crops",
    color: "var(--chart-2)",
  },
  operations: {
    label: "Operations",
    color: "var(--chart-3)",
  },
};
import { getEventDisplayLabel, getEventSummary } from "../lib/eventUtils";
function Overview() {
  const [species, setSpecies] = useState([]);
  const [entityCount, setEntityCount] = useState(null);
  const [feedAlerts, setFeedAlerts] = useState([]);
  const [taskSummary, setTaskSummary] = useState(null);
  const [error, setError] = useState("");
  const [activityEvents, setActivityEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      const [
        speciesRes,
        entitiesRes,
        itemsRes,
        lotsRes,
        feedEventsRes,
        tasksRes,
        activityEventsRes,
      ] = await Promise.all([
        supabase
          .from("species_config")
          .select("id, name, category")
          .order("name"),

        supabase
          .from("farm_entities")
          .select("id", { count: "exact", head: true }),

        supabase.from("inventory_items").select("*"),

        supabase.from("inventory_lots").select("*"),

        supabase
          .from("entity_events")
          .select("occurred_at, payload")
          .eq("type", "feed_given"),

        supabase
          .from("tasks")
          .select("due_at, priority, completed_at")
          .is("completed_at", null),

        supabase
          .from("entity_events")
          .select(
            `id, entity_id, type, payload, occurred_at, created_at, farm_entities:entity_id (id, entity_name, label, species_config:species_config_id (id, name, category))`,
          )
          .order("occurred_at", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      if (speciesRes.error) {
        setError(speciesRes.error.message);
      } else {
        setSpecies(speciesRes.data ?? []);
      }

      if (!entitiesRes.error) {
        setEntityCount(entitiesRes.count ?? 0);
      }

      if (!itemsRes.error && !lotsRes.error && !feedEventsRes.error) {
        const lotsByItem = {};

        for (const lot of lotsRes.data ?? []) {
          if (!lotsByItem[lot.item_id]) {
            lotsByItem[lot.item_id] = [];
          }

          lotsByItem[lot.item_id].push(lot);
        }

        const alerts = (itemsRes.data ?? []).map((item) => {
          const { totalRemaining } = computeStock(lotsByItem[item.id] ?? []);

          const itemFeedEvents = (feedEventsRes.data ?? []).filter(
            (event) => event.payload?.item_id === item.id,
          );

          const dailyMap = aggregateDailyConsumption(itemFeedEvents);
          const rate = computeDailyRate(dailyMap);
          const remaining = daysRemaining(totalRemaining, rate);

          const alert = classifyAlert(remaining, item.reorder_lead_time_days);

          const monthlyReq = estimateMonthlyRequirement(rate);

          return {
            item,
            totalRemaining,
            rate,
            remaining,
            alert,
            monthlyReq,
          };
        });

        setFeedAlerts(alerts);
      }

      if (!tasksRes.error) {
        const today = localDateISO();
        const openTasks = tasksRes.data ?? [];

        const overdue = openTasks.filter(
          (task) => classifyTask(task, today) === "overdue",
        ).length;

        const dueToday = openTasks.filter(
          (task) => classifyTask(task, today) === "today",
        ).length;

        const critical = openTasks.filter(
          (task) => task.priority === "critical",
        ).length;

        setTaskSummary({
          overdue,
          dueToday,
          critical,
          total: openTasks.length,
        });
      }
      if (!activityEventsRes.error) {
        setActivityEvents(activityEventsRes.data ?? []);
      }

      setLoading(false);
    }

    load();
  }, []);

  const healthyFeed = feedAlerts.filter(
    (item) => item.alert === "green",
  ).length;

  const warningFeed = feedAlerts.filter(
    (item) => item.alert === "yellow",
  ).length;

  const criticalFeed = feedAlerts.filter((item) => item.alert === "red").length;
  const activityChartData = buildActivityChartData(activityEvents);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-5 border-b border-border/60 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            <Sprout className="size-4 text-primary" />
            <span>Farm OS</span>
          </div>

          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.03em] text-foreground sm:text-5xl">
              Overview
            </h1>

            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              A live view of your farm operations, inventory, and tasks.
            </p>
          </div>
        </div>

        <Button
          asChild
          size="lg"
          className="w-auto shrink-0 rounded-xl px-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <Link
            to="/farm-os/daily-log"
            className="flex flex-row items-center gap-2 whitespace-nowrap"
          >
            <ClipboardList className="size-4 shrink-0" />
            <span>Add Daily Log</span>
          </Link>
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/40">
          <CardContent className="flex items-center gap-3 pt-6 text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <OverviewSkeleton />
      ) : (
        <>
          {/* KPI CARDS */}
          <section>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Species & Crops"
                value={species.length}
                description="Configured in Farm OS"
                icon={Sprout}
              />

              <MetricCard
                title="Farm Entities"
                value={entityCount ?? "—"}
                description="Animals, plots & other entities"
                icon={Boxes}
              />

              <MetricCard
                title="Open Tasks"
                value={taskSummary?.total ?? 0}
                description={
                  taskSummary?.overdue
                    ? `${taskSummary.overdue} overdue`
                    : "No overdue tasks"
                }
                icon={ClipboardList}
                warning={taskSummary?.overdue > 0}
              />

              <MetricCard
                title="Feed Items"
                value={feedAlerts.length}
                description={
                  criticalFeed > 0
                    ? `${criticalFeed} need attention now`
                    : warningFeed > 0
                      ? `${warningFeed} need attention soon`
                      : "Stock levels healthy"
                }
                icon={Package}
                warning={criticalFeed > 0}
              />
            </div>
          </section>

          {/* OPERATIONAL STATUS */}
          <section className="grid items-start gap-5 lg:grid-cols-3">
            <Card className="border-border/70 bg-card shadow-sm lg:col-span-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader className="px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base font-semibold sm:text-lg">
                      Farm Status
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Current operational signals from your farm data.
                    </CardDescription>
                  </div>

                  <div className="flex size-9 items-center justify-center rounded-lg bg-secondary">
                    <Activity className="size-4 text-primary" />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="px-6 pb-6 pt-0">
                <div className="grid gap-3 sm:grid-cols-3">
                  <StatusItem
                    icon={CheckCircle2}
                    label="Healthy feed"
                    value={healthyFeed}
                  />

                  <StatusItem
                    icon={Clock}
                    label="Reorder soon"
                    value={warningFeed}
                  />

                  <StatusItem
                    icon={AlertTriangle}
                    label="Reorder now"
                    value={criticalFeed}
                    destructive
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-secondary">
                    <ClipboardList className="size-4 text-primary" />
                  </div>

                  <CardTitle className="text-base font-semibold sm:text-lg">
                    Tasks
                  </CardTitle>
                </div>
                <CardDescription className="text-sm">
                  What needs attention today.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-2 pt-0">
                <TaskStat
                  label="Due today"
                  value={taskSummary?.dueToday ?? 0}
                />

                <Separator />

                <TaskStat
                  label="Overdue"
                  value={taskSummary?.overdue ?? 0}
                  destructive={taskSummary?.overdue > 0}
                />

                <Separator />

                <TaskStat
                  label="Critical"
                  value={taskSummary?.critical ?? 0}
                  destructive={taskSummary?.critical > 0}
                />

                <Button
                  asChild
                  variant="ghost"
                  className="mt-3 w-full !flex-row !items-center !justify-center gap-2 px-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Link
                    to="/farm-os/tasks"
                    className="!flex !flex-row !items-center !justify-center gap-2 whitespace-nowrap"
                  >
                    <span>View tasks</span>
                    <ArrowRight className="size-4 shrink-0" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </section>

          {/* FEED INTELLIGENCE */}
          <section>
            <Card className="border-border/70 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader className="px-6 py-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base font-semibold sm:text-lg">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-secondary">
                        <Package className="size-4 text-primary" />
                      </div>
                      Feed & stock intelligence
                    </CardTitle>

                    <CardDescription className="text-sm">
                      Reorder signals calculated from actual consumption
                      history.
                    </CardDescription>
                  </div>

                  <Button
                    asChild
                    variant="ghost"
                    className="!inline-flex !shrink-0 !flex-row !items-center !justify-center gap-2 whitespace-nowrap"
                  >
                    <Link
                      to="/farm-os/inventory"
                      className="!flex !flex-row !items-center !justify-center gap-2 whitespace-nowrap"
                    >
                      <span>Open inventory</span>
                      <ArrowRight className="size-4 shrink-0" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>

              <CardContent
                className={feedAlerts.length === 0 ? "pt-0" : undefined}
              >
                {feedAlerts.length === 0 ? (
                  <EmptyState
                    icon={Package}
                    title="Feed intelligence is waiting for inventory data"
                    description="Add feed and inventory items to unlock stock coverage, consumption rates, reorder timing, and monthly requirements."
                    href="/farm-os/inventory"
                    action="Set up inventory"
                    compact
                  />
                ) : (
                  <div className="space-y-3">
                    {feedAlerts.map(
                      ({
                        item,
                        totalRemaining,
                        rate,
                        remaining,
                        alert,
                        monthlyReq,
                      }) => (
                        <FeedAlertRow
                          key={item.id}
                          item={item}
                          totalRemaining={totalRemaining}
                          rate={rate}
                          remaining={remaining}
                          alert={alert}
                          monthlyReq={monthlyReq}
                        />
                      ),
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* FARM ACTIVITY */}
          <section className="grid gap-5 lg:grid-cols-3">
            <Card className="border-border/70 bg-card shadow-sm lg:col-span-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base font-semibold sm:text-lg">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-secondary">
                        <Activity className="size-4 text-primary" />
                      </div>
                      Farm activity
                    </CardTitle>

                    <CardDescription className="mt-1 text-sm">
                      Recorded farm events over the last 14 days.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {activityChartData.every(
                  (day) =>
                    day.livestock === 0 &&
                    day.crops === 0 &&
                    day.operations === 0,
                ) ? (
                  <EmptyState
                    icon={Activity}
                    title="No activity recorded yet"
                    description="Start adding daily logs and farm events to build your activity history."
                    href="/farm-os/daily-log"
                    action="Add daily log"
                  />
                ) : (
                  <ChartContainer
                    config={activityChartConfig}
                    className="h-[280px] w-full"
                  >
                    <BarChart
                      accessibilityLayer
                      data={activityChartData}
                      margin={{
                        top: 8,
                        right: 8,
                        left: 8,
                        bottom: 8,
                      }}
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />

                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        tickFormatter={(value) => value.slice(5)}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        width={28}
                        tick={{ fontSize: 12 }}
                      />

                      <Legend
                        verticalAlign="top"
                        align="right"
                        height={32}
                        iconType="circle"
                      />

                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent />}
                      />

                      <Bar
                        dataKey="livestock"
                        stackId="activity"
                        fill="var(--color-livestock)"
                        radius={[0, 0, 0, 0]}
                      />

                      <Bar
                        dataKey="crops"
                        stackId="activity"
                        fill="var(--color-crops)"
                        radius={[0, 0, 0, 0]}
                      />

                      <Bar
                        dataKey="operations"
                        stackId="activity"
                        fill="var(--color-operations)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <RecentActivity events={activityEvents} />
          </section>

          {/* SPECIES */}
          <section>
            <Card className="border-border/70 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader className="px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base font-semibold sm:text-lg">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-secondary">
                        <Sprout className="size-4 text-primary" />
                      </div>
                      Species & Crops
                    </CardTitle>

                    <CardDescription className="mt-1 text-sm">
                      Configured species and farm production areas.
                    </CardDescription>
                  </div>

                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="shrink-0 whitespace-nowrap"
                  >
                    <Link
                      to="/farm-os/species"
                      className="flex items-center gap-2 whitespace-nowrap"
                    >
                      <span>Manage</span>
                      <ArrowRight className="size-4 shrink-0" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                {species.length === 0 ? (
                  <EmptyState
                    icon={Sprout}
                    title="No species configured"
                    description="Add your first species or crop from the Species page."
                    href="/farm-os/species"
                    action="Manage species"
                  />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {species.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg border bg-card p-4"
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>

                          <p className="text-sm text-muted-foreground">
                            {item.category}
                          </p>
                        </div>

                        <Badge variant="secondary">{item.category}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* EMPTY FARM STATE */}
          {entityCount === 0 && (
            <Card>
              <CardContent className="flex flex-col items-start gap-4 py-8 sm:flex-row sm:items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <Boxes className="h-6 w-6 text-primary" />
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold">
                    Start registering your farm entities
                  </h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Register your quail, goats, chickens, crop plots, or other
                    farm entities to begin building your farm history.
                  </p>
                </div>

                <Button asChild variant="outline">
                  <Link to="/farm-os/species">
                    Add entities
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  warning = false,
}) {
  return (
    <Card className="group border-border/70 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md">
      <CardContent className="flex items-start justify-between gap-3 p-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>

          <p
            className={`mt-1.5 text-2xl font-semibold tracking-[-0.03em] ${
              warning ? "text-destructive" : "text-foreground"
            }`}
          >
            {value}
          </p>

          <p
            className={`mt-1 text-xs ${
              warning ? "font-medium text-destructive" : "text-muted-foreground"
            }`}
          >
            {description}
          </p>
        </div>

        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-secondary/70 transition-all duration-200 group-hover:border-primary/20 group-hover:bg-primary/10">
          <Icon className="size-4 text-primary" />
        </div>
      </CardContent>
    </Card>
  );
}

function StatusItem({ icon: Icon, label, value, destructive = false }) {
  return (
    <div className="group rounded-xl border border-border/70 bg-muted/30 p-4 transition-colors duration-200 hover:border-primary/20 hover:bg-secondary/20">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon
          className={`size-4 ${
            destructive ? "text-destructive" : "text-primary"
          }`}
        />

        <span>{label}</span>
      </div>

      <p
        className={`mt-3 text-3xl font-semibold tracking-[-0.03em] ${
          destructive && value > 0 ? "text-destructive" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function TaskStat({ label, value, destructive = false }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>

      <span
        className={`text-xl font-semibold ${
          destructive && value > 0 ? "text-destructive" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function FeedAlertRow({
  item,
  totalRemaining,
  rate,
  remaining,
  alert,
  monthlyReq,
}) {
  const badgeVariant =
    alert === "red"
      ? "destructive"
      : alert === "yellow"
        ? "secondary"
        : "outline";

  const label =
    alert === "green"
      ? "Healthy"
      : alert === "yellow"
        ? "Reorder soon"
        : alert === "red"
          ? "Reorder now"
          : "Insufficient data";

  const progressValue =
    remaining == null ? 0 : Math.min(100, Math.max(0, (remaining / 30) * 100));

  return (
    <div className="rounded-xl border bg-background/60 p-5 transition-colors hover:bg-secondary/20">
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{item.name}</h3>
              <Badge variant={badgeVariant}>{label}</Badge>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              {totalRemaining.toFixed(1)} {item.unit} currently in stock
            </p>
          </div>

          {remaining != null && (
            <div className="shrink-0 text-left sm:text-right">
              <p className="text-xs text-muted-foreground">
                Estimated coverage
              </p>
              <p className="text-lg font-semibold tracking-tight">
                {remaining.toFixed(1)} days
              </p>
            </div>
          )}
        </div>

        {/* Coverage */}
        {remaining != null && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>30-day coverage target</span>
              <span>{Math.round(progressValue)}%</span>
            </div>

            <Progress value={progressValue} className="h-2" />
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3 border-t pt-4">
          <div>
            <p className="text-xs text-muted-foreground">Daily use</p>
            <p className="mt-1 text-sm font-semibold">
              {rate != null ? `${rate.toFixed(2)} ${item.unit}` : "—"}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">30-day need</p>
            <p className="mt-1 text-sm font-semibold">
              {monthlyReq != null
                ? `${monthlyReq.toFixed(1)} ${item.unit}`
                : "—"}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Reorder lead</p>
            <p className="mt-1 text-sm font-semibold">
              {item.reorder_lead_time_days != null
                ? `${item.reorder_lead_time_days} days`
                : "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  href,
  action,
  compact = false,
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-dashed px-6 text-center ${
        compact ? "py-6" : "py-10"
      }`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
        <Icon className="h-6 w-6 text-primary" />
      </div>

      <h3 className="mt-4 font-semibold">{title}</h3>

      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {description}
      </p>

      {href && action && (
        <Button asChild variant="outline" className="mt-4">
          <Link to={href}>{action}</Link>
        </Button>
      )}
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-3 pt-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/70 shadow-sm lg:col-span-2">
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <Skeleton className="h-5 w-48" />

          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
function buildActivityChartData(events) {
  const days = [];

  for (let index = 13; index >= 0; index -= 1) {
    const date = new Date();

    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - index);

    days.push({
      date: date.toISOString().slice(0, 10),
      livestock: 0,
      crops: 0,
      operations: 0,
    });
  }

  const categoryMap = {};

  for (const event of events ?? []) {
    const date = new Date(event.occurred_at);

    if (Number.isNaN(date.getTime())) {
      continue;
    }

    const dateKey = date.toISOString().slice(0, 10);
    const category = getActivityCategory(event.type);

    if (!categoryMap[dateKey]) {
      categoryMap[dateKey] = {
        livestock: 0,
        crops: 0,
        operations: 0,
      };
    }

    categoryMap[dateKey][category] += 1;
  }

  return days.map((day) => ({
    ...day,
    ...(categoryMap[day.date] ?? {}),
  }));
}

function getActivityCategory(type) {
  const livestockEvents = [
    "weight",
    "feed",
    "egg_production",
    "treatment",
    "mortality",
    "breeding",
    "health_note",

    // Legacy event types
    "Feed_given",
    "Egg_count",
  ];

  const cropEvents = [
    "planting",
    "fertilizer_applied",
    "irrigation",
    "pest_observation",
    "growth_stage",
    "harvest",
    "processing",
  ];

  if (livestockEvents.includes(type)) {
    return "livestock";
  }

  if (cropEvents.includes(type)) {
    return "crops";
  }

  return "operations";
}

function RecentActivity({ events }) {
  return (
    <Card className="border-border/70 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold sm:text-lg">
          Recent activity
        </CardTitle>
        <CardDescription className="text-sm">
          Latest events recorded in Farm OS.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {events.length === 0 ? (
          <div className="py-6 text-center">
            <Activity className="mx-auto h-8 w-8 text-muted-foreground" />

            <p className="mt-3 text-sm font-medium">No recent activity</p>

            <p className="mt-1 text-xs text-muted-foreground">
              Recorded farm events will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.slice(0, 3).map((event, index) => (
              <div
                key={event.id}
                className="group relative flex items-start gap-3"
              >
                {index < Math.min(events.length, 3) - 1 && (
                  <div className="absolute left-4 top-8 h-full w-px bg-border" />
                )}

                <div className="relative z-10 mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border bg-secondary">
                  <Activity className="size-4 text-primary" />
                </div>

                <div className="min-w-0 flex-1 pb-5">
                  <p className="text-sm font-medium">
                    {getEventDisplayLabel(event.type)}
                  </p>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatActivityDate(event.created_at)}
                  </p>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {getEventSummary(event)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
function formatActivityDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default Overview;
