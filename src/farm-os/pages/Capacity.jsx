import { useState } from "react";
import { Boxes, Calculator } from "lucide-react";
import { summarizeCapacity } from "../engines/capacityEngine";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const DEFAULT_CONSTRAINTS = [
  { name: "Fodder/feed capacity", capacity: "", measured: false },
  { name: "Shed/space capacity", capacity: "", measured: false },
  { name: "Budget capacity", capacity: "", measured: false },
  { name: "Labour capacity", capacity: "", measured: false },
];

const LEVEL_LABEL = {
  safe: "🟢 Safe capacity",
  stretch: "🟡 Stretch capacity",
  over: "🔴 Overcapacity",
};

function Capacity() {
  const [scenarioLabel, setScenarioLabel] = useState("");
  const [currentCount, setCurrentCount] = useState("");
  const [proposedCount, setProposedCount] = useState("");
  const [constraints, setConstraints] = useState(DEFAULT_CONSTRAINTS);
  const [stretchMultiplier, setStretchMultiplier] = useState(1.5);
  const [result, setResult] = useState(null);

  function updateConstraint(index, field, value) {
    setConstraints((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function addConstraint() {
    setConstraints((prev) => [
      ...prev,
      { name: "", capacity: "", measured: false },
    ]);
  }

  function removeConstraint(index) {
    setConstraints((prev) => prev.filter((_, i) => i !== index));
  }

  function handleCalculate(e) {
    e.preventDefault();
    const valid = constraints
      .filter((c) => c.name.trim() && c.capacity !== "")
      .map((c) => ({ ...c, capacity: Number(c.capacity) }));

    if (valid.length === 0 || proposedCount === "") {
      setResult({
        error:
          "Enter a proposed count and at least one constraint with a value.",
      });
      return;
    }

    const summary = summarizeCapacity(
      valid,
      Number(proposedCount),
      Number(stretchMultiplier),
    );
    setResult(summary);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Boxes className="mt-1 size-5 shrink-0 text-primary" />

        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em]">
            Capacity
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            How many animals can my farm sustainably support? Enter what you
            know for each resource. Mark a figure as measured only if it comes
            from real records; otherwise it is treated as an estimate.
          </p>
        </div>
      </div>

      <Card className="border-border/70 bg-card shadow-sm">
        <CardContent className="space-y-6 p-5">
          <form onSubmit={handleCalculate} className="space-y-6">
            <div className="flex items-start gap-2">
              <Calculator className="mt-0.5 size-4 shrink-0 text-primary" />

              <div>
                <h2 className="text-base font-semibold">Capacity scenario</h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Define what you are scaling and the proposed farm size.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Input
                type="text"
                placeholder="What are you scaling? e.g. Goats"
                value={scenarioLabel}
                onChange={(e) => setScenarioLabel(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Current count"
                value={currentCount}
                onChange={(e) => setCurrentCount(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Proposed count"
                value={proposedCount}
                onChange={(e) => setProposedCount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-3">
              {constraints.map((c, i) => (
                <div
                  key={i}
                  className="grid gap-3 rounded-lg border border-border/70 bg-muted/20 p-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-center"
                >
                  <Input
                    type="text"
                    placeholder="Constraint name"
                    value={c.name}
                    onChange={(e) =>
                      updateConstraint(i, "name", e.target.value)
                    }
                    aria-label={`Constraint ${i + 1} name`}
                  />

                  <Input
                    type="number"
                    placeholder="Capacity (count supported)"
                    value={c.capacity}
                    onChange={(e) =>
                      updateConstraint(i, "capacity", e.target.value)
                    }
                    aria-label={`Constraint ${i + 1} capacity`}
                  />

                  <label className="flex h-9 items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={c.measured}
                      onChange={(e) =>
                        updateConstraint(i, "measured", e.target.checked)
                      }
                      className="size-4 rounded border-border accent-primary"
                    />
                    Measured
                  </label>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeConstraint(i)}
                    className="text-destructive hover:text-destructive"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-end sm:justify-between">
              <Button type="button" variant="outline" onClick={addConstraint}>
                + Add constraint
              </Button>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="space-y-2 text-sm font-medium">
                  <span>Stretch multiplier </span>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={stretchMultiplier}
                    onChange={(e) => setStretchMultiplier(e.target.value)}
                    className="w-full sm:w-32"
                  />
                </label>

                <Button type="submit">
                  <Calculator className="size-4" />
                  Calculate
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {result?.error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-destructive">
              {result.error}
            </p>
          </CardContent>
        </Card>
      )}

      {result && !result.error && (
        <Card className="border-border/70 bg-card shadow-sm">
          <CardContent className="space-y-5 p-5">
            <div>
              <h2 className="text-lg font-semibold">
                {LEVEL_LABEL[result.level]}
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Capacity assessment based on the constraints you provided.
              </p>
            </div>
            {scenarioLabel && (
              <div className="rounded-lg border border-border/70 bg-muted/30 px-4 py-3">
                <p className="text-sm font-medium">
                  {currentCount || "0"} → {proposedCount} {scenarioLabel}
                </p>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/70 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Bottleneck
                </p>

                <p className="mt-1 text-sm">
                  <strong>{result.bottleneck.name}</strong>
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Supports up to{" "}
                  <span className="font-medium text-foreground">
                    {result.safeCapacity}
                  </span>{" "}
                  {result.bottleneck.measured ? "(measured)" : "(estimated)"}
                </p>
              </div>

              <div className="rounded-lg border border-border/70 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Stretch capacity
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {result.stretchCapacity.toFixed(1)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Constraint breakdown</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Capacity available from each resource.
                </p>
              </div>

              <div className="divide-y rounded-lg border border-border/70">
                {result.allConstraints.map((c, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-sm font-medium">{c.name}</span>

                    <span className="text-sm text-muted-foreground">
                      {c.capacity} {c.measured ? "(measured)" : "(estimated)"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default Capacity;
