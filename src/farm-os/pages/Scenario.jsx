import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { summarizeCapacity } from "../engines/capacityEngine";
import { computeScenarioFinancials, recommendationFor } from "../engines/scenarioEngine";
import "./Scenario.css";

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
      const { data, error } = await supabase.from("species_config").select("*").order("name");
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

      const total = (entities ?? []).reduce((sum, e) => sum + Number(e.quantity ?? 0), 0);
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
      validConstraints.length > 0 ? summarizeCapacity(validConstraints, proposedTotal, Number(stretchMultiplier)) : null;

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

  if (loading) return <p className="farmos-scenario__status">Loading…</p>;
  if (loadError)
    return <p className="farmos-scenario__status farmos-scenario__status--error">{loadError}</p>;

  const selectedSpecies = speciesList.find((s) => s.id === selectedSpeciesId);

  return (
    <div className="farmos-scenario">
      <h1 className="farmos-scenario__title">Scenario Simulator</h1>
      <p className="farmos-scenario__intro">
        "What happens if I add N of X?" — combines your resource constraints with rough
        financial assumptions to give a capacity-aware recommendation.
      </p>

      <form className="farmos-scenario__form" onSubmit={handleRun}>
        <div className="farmos-scenario__fields">
          <select value={selectedSpeciesId} onChange={(e) => setSelectedSpeciesId(e.target.value)}>
            <option value="">Species/crop…</option>
            {speciesList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Count to add"
            value={addCount}
            onChange={(e) => setAddCount(e.target.value)}
            required
          />
        </div>

        {selectedSpecies && (
          <p className="farmos-scenario__maturity">
            Currently {currentCount} {selectedSpecies.name}.{" "}
            {maturity && maturity.eventCount > 0
              ? `Projection informed by ${maturity.eventCount} logged events over ${maturity.daysOfHistory} days of real history.`
              : "No logged history for this species yet — treat projections below as rough estimates only."}
          </p>
        )}

        <div className="farmos-scenario__fields">
          <label>
            Investment/unit (৳)
            <input
              type="number"
              value={initialInvestmentPerUnit}
              onChange={(e) => setInitialInvestmentPerUnit(e.target.value)}
            />
          </label>
          <label>
            Monthly cost/unit (৳)
            <input
              type="number"
              value={monthlyCostPerUnit}
              onChange={(e) => setMonthlyCostPerUnit(e.target.value)}
            />
          </label>
          <label>
            Monthly revenue/unit (৳)
            <input
              type="number"
              value={monthlyRevenuePerUnit}
              onChange={(e) => setMonthlyRevenuePerUnit(e.target.value)}
            />
          </label>
        </div>

        <h3 className="farmos-scenario__subheading">Resource constraints (total capacity, including current)</h3>
        <label className="farmos-scenario__stretch-input">
          Stretch multiplier
          <input
            type="number"
            step="0.1"
            value={stretchMultiplier}
            onChange={(e) => setStretchMultiplier(e.target.value)}
          />
        </label>
        {constraints.map((c, i) => (
          <div key={i} className="farmos-scenario__constraint-row">
            <input
              type="text"
              value={c.name}
              onChange={(e) => updateConstraint(i, "name", e.target.value)}
            />
            <input
              type="number"
              placeholder="Capacity"
              value={c.capacity}
              onChange={(e) => updateConstraint(i, "capacity", e.target.value)}
            />
            <label className="farmos-scenario__measured-toggle">
              <input
                type="checkbox"
                checked={c.measured}
                onChange={(e) => updateConstraint(i, "measured", e.target.checked)}
              />
              Measured
            </label>
          </div>
        ))}

        <button type="submit" className="farmos-scenario__run">
          Run scenario
        </button>
      </form>

      {result && (
        <div
          className={`farmos-scenario__result${
            result.capacitySummary ? ` farmos-scenario__result--${result.capacitySummary.level}` : ""
          }`}
        >
          <h2>Result</h2>
          <p className="farmos-scenario__recommendation">{result.recommendation}</p>

          {result.capacitySummary && (
            <p className="farmos-scenario__line">
              Bottleneck: <strong>{result.capacitySummary.bottleneck.name}</strong> (
              {result.capacitySummary.bottleneck.capacity}
              {result.capacitySummary.bottleneck.measured ? ", measured" : ", estimated"}) vs.
              proposed total {result.proposedTotal}
            </p>
          )}

          <div className="farmos-scenario__financials">
            <span>Investment: ৳{result.financials.totalInvestment.toFixed(2)}</span>
            <span>Monthly cost: ৳{result.financials.totalMonthlyCost.toFixed(2)}</span>
            <span>Monthly revenue: ৳{result.financials.totalMonthlyRevenue.toFixed(2)}</span>
            <span>Monthly margin: ৳{result.financials.monthlyMargin.toFixed(2)}</span>
            {result.financials.paybackMonths != null && (
              <span>Payback: {result.financials.paybackMonths.toFixed(1)} months</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Scenario;
