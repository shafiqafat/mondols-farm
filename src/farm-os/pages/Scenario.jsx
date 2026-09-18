import { useEffect, useState } from "react";
import { BarChart3, Calculator } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { summarizeCapacity } from "../engines/capacityEngine";
import {
  computeScenarioFinancials,
  recommendationFor,
} from "../engines/scenarioEngine";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DEFAULT_CONSTRAINTS = [
  { name: "Fodder/feed capacity", capacity: "", measured: false },
  { name: "Shed/space capacity", capacity: "", measured: false },
  { name: "Budget capacity", capacity: "", measured: false },
  { name: "Labour capacity", capacity: "", measured: false },
];

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24)) + 1;
}

function Scenario() {
  const [speciesList, setSpeciesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [selectedSpeciesId, setSelectedSpeciesId] = useState("");
  const [currentCount, setCurrentCount] = useState(0);
  const [maturity, setMaturity] = useState(null); // { eventCount, daysOfHistory } | null

  const [addCount, setAddCount] = useState("");
  const [initialInvestmentPerUnit, setInitialInvestmentPerUnit] = useState("");
  const [monthlyCostPerUnit, setMonthlyCostPerUnit] = useState("");
  const [monthlyRevenuePerUnit, setMonthlyRevenuePerUnit] = useState("");
  const [constraints, setConstraints] = useState(DEFAULT_CONSTRAINTS);
  const [stretchMultiplier, setStretchMultiplier] = useState(1.5);

  const [result, setResult] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("species_config")
        .select("*")
        .order("name");
      if (error) setLoadError(error.message);
      else setSpeciesList(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    async function loadSpeciesContext() {
      if (!selectedSpeciesId) {
        setCurrentCount(0);
        setMaturity(null);
        return;
      }

      const { data: entities } = await supabase
        .from("farm_entities")
        .select("id, quantity")
        .eq("species_config_id", selectedSpeciesId)
        .eq("status", "active");

      const total = (entities ?? []).reduce(
        (sum, e) => sum + Number(e.quantity ?? 0),
        0,
      );
      setCurrentCount(total);

      const entityIds = (entities ?? []).map((e) => e.id);
      if (entityIds.length === 0) {
        setMaturity({ eventCount: 0, daysOfHistory: 0 });
        return;
      }

      const { data: events } = await supabase
        .from("entity_events")
        .select("occurred_at")
        .in("entity_id", entityIds);

      if (!events || events.length === 0) {
        setMaturity({ eventCount: 0, daysOfHistory: 0 });
        return;
      }

      const dates = events.map((e) => e.occurred_at).sort();
      setMaturity({
        eventCount: events.length,
        daysOfHistory: daysBetween(dates[0], dates[dates.length - 1]),
      });
    }

    loadSpeciesContext();
  }, [selectedSpeciesId]);

  function updateConstraint(index, field, value) {
    setConstraints((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function handleRun(e) {
    e.preventDefault();

    const validConstraints = constraints
      .filter((c) => c.name.trim() && c.capacity !== "")
      .map((c) => ({ ...c, capacity: Number(c.capacity) }));

    const proposedTotal = currentCount + Number(addCount || 0);
    const capacitySummary =
      validConstraints.length > 0
        ? summarizeCapacity(
            validConstraints,
            proposedTotal,
            Number(stretchMultiplier),
          )
        : null;

    const financials = computeScenarioFinancials({
      count: Number(addCount || 0),
      initialInvestmentPerUnit: Number(initialInvestmentPerUnit || 0),
      monthlyCostPerUnit: Number(monthlyCostPerUnit || 0),
      monthlyRevenuePerUnit: Number(monthlyRevenuePerUnit || 0),
    });

    const recommendation = capacitySummary
      ? recommendationFor(capacitySummary.level, financials.monthlyMargin)
      : "Add at least one resource constraint to get a capacity-aware recommendation.";

    setResult({ capacitySummary, financials, recommendation, proposedTotal });
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }
  if (loadError) {
    return (
      <Card className="border-destructive/30 bg-card shadow-sm">
        <CardContent className="p-5">
          <p className="text-sm text-destructive">{loadError}</p>
        </CardContent>
      </Card>
    );
  }

  const selectedSpecies = speciesList.find((s) => s.id === selectedSpeciesId);

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <BarChart3 className="mt-1 size-5 shrink-0 text-primary" />

        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em]">
            Scenario Simulator
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            What happens if I add N of X? Combine your resource constraints with
            rough financial assumptions to explore a potential farm scenario.
          </p>
        </div>
      </div>

      <Card className="border-border/70 bg-card shadow-sm">
        <CardContent className="space-y-5 p-5">
          <form onSubmit={handleRun} className="space-y-6">
            <div className="flex items-center gap-2">
              <Calculator className="size-4 text-primary" />

              <div>
                <h2 className="text-base font-semibold">Scenario inputs</h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Choose what you want to scale and enter the assumptions for
                  the scenario.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <select
                value={selectedSpeciesId}
                onChange={(e) => setSelectedSpeciesId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
              >
                <option value="">Species/crop…</option>
                {speciesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                placeholder="Count to add"
                value={addCount}
                onChange={(e) => setAddCount(e.target.value)}
                required
              />
            </div>

            {selectedSpecies && (
              <div className="rounded-lg border border-border/70 bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  Currently {currentCount} {selectedSpecies.name}.
                </span>{" "}
                {maturity && maturity.eventCount > 0
                  ? `Projection informed by ${maturity.eventCount} logged events over ${maturity.daysOfHistory} days of real history.`
                  : "No logged history for this species yet — treat projections below as rough estimates only."}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Financial assumptions</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use rough per-unit estimates to model the financial effect of
                  adding this count.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="space-y-2 text-sm font-medium">
                  <span>Investment/unit (৳)</span>
                  <Input
                    type="number"
                    value={initialInvestmentPerUnit}
                    onChange={(e) =>
                      setInitialInvestmentPerUnit(e.target.value)
                    }
                  />
                </label>

                <label className="space-y-2 text-sm font-medium">
                  <span>Monthly cost/unit (৳)</span>
                  <Input
                    type="number"
                    value={monthlyCostPerUnit}
                    onChange={(e) => setMonthlyCostPerUnit(e.target.value)}
                  />
                </label>

                <label className="space-y-2 text-sm font-medium">
                  <span>Monthly revenue/unit (৳)</span>
                  <Input
                    type="number"
                    value={monthlyRevenuePerUnit}
                    onChange={(e) => setMonthlyRevenuePerUnit(e.target.value)}
                  />
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Resource constraints</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Total capacity available on the farm, including your current
                  operation.
                </p>
              </div>
              <label className="flex max-w-xs flex-col gap-1.5 text-sm font-medium">
                <span>Stretch multiplier</span>
                <Input
                  type="number"
                  step="0.1"
                  value={stretchMultiplier}
                  onChange={(e) => setStretchMultiplier(e.target.value)}
                />
                <span className="block text-xs font-normal text-muted-foreground">
                  Allows the simulator to model capacity beyond the stated
                  limit.
                </span>
              </label>
              {constraints.map((c, i) => (
                <div
                  key={i}
                  className="grid gap-3 rounded-lg border border-border/70 bg-background/50 p-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] sm:items-end"
                >
                  <label className="flex flex-col gap-1.5 text-sm font-medium">
                    <span>Resource</span>
                    <Input
                      type="text"
                      value={c.name}
                      onChange={(e) =>
                        updateConstraint(i, "name", e.target.value)
                      }
                    />
                  </label>

                  <label className="flex flex-col gap-1.5 text-sm font-medium">
                    <span>Capacity</span>
                    <Input
                      type="number"
                      placeholder="Capacity"
                      value={c.capacity}
                      onChange={(e) =>
                        updateConstraint(i, "capacity", e.target.value)
                      }
                    />
                  </label>

                  <label className="flex items-center gap-2 pb-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={c.measured}
                      onChange={(e) =>
                        updateConstraint(i, "measured", e.target.checked)
                      }
                      className="size-4 rounded border-input accent-primary"
                    />
                    Measured
                  </label>
                </div>
              ))}
            </div>

            <Button type="submit" className="w-full sm:w-auto">
              Run scenario
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card
          className={`border-border/70 bg-card shadow-sm ${
            result.capacitySummary?.level === "safe"
              ? "border-l-4 border-l-primary"
              : result.capacitySummary?.level === "stretch"
                ? "border-l-4 border-l-amber-500"
                : result.capacitySummary?.level === "over"
                  ? "border-l-4 border-l-destructive"
                  : ""
          }`}
        >
          <CardContent className="space-y-4 p-5">
            <h2 className="text-base font-semibold">Result</h2>
            <p className="rounded-lg bg-muted/50 px-3 py-2.5 text-sm leading-6 text-foreground">
              {result.recommendation}
            </p>

            {result.capacitySummary && (
              <p className="text-sm leading-6 text-muted-foreground">
                Bottleneck:{" "}
                <strong className="font-semibold text-foreground">
                  {result.capacitySummary.bottleneck.name}
                </strong>{" "}
                ({result.capacitySummary.bottleneck.capacity}
                {result.capacitySummary.bottleneck.measured
                  ? ", measured"
                  : ", estimated"}
                ) vs. proposed total {result.proposedTotal}
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <span>
                Investment: ৳{result.financials.totalInvestment.toFixed(2)}
              </span>
              <span>
                Monthly cost: ৳{result.financials.totalMonthlyCost.toFixed(2)}
              </span>
              <span>
                Monthly revenue: ৳
                {result.financials.totalMonthlyRevenue.toFixed(2)}
              </span>
              <span>
                Monthly margin: ৳{result.financials.monthlyMargin.toFixed(2)}
              </span>
              {result.financials.paybackMonths != null && (
                <span>
                  Payback: {result.financials.paybackMonths.toFixed(1)} months
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default Scenario;
