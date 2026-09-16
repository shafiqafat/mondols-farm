import { useState } from "react";
import { summarizeCapacity } from "../engines/capacityEngine";
import "./Capacity.css";

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
    setConstraints((prev) => [...prev, { name: "", capacity: "", measured: false }]);
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
      setResult({ error: "Enter a proposed count and at least one constraint with a value." });
      return;
    }

    const summary = summarizeCapacity(valid, Number(proposedCount), Number(stretchMultiplier));
    setResult(summary);
  }

  return (
    <div className="farmos-capacity">
      <h1 className="farmos-capacity__title">Capacity</h1>
      <p className="farmos-capacity__intro">
        "How many animals can my farm sustainably support?" — enter what you know for each
        resource. Mark a figure as measured only if it comes from real records (e.g. fodder
        yield); otherwise it's your best estimate, and the result will say so.
      </p>

      <form onSubmit={handleCalculate} className="farmos-capacity__form">
        <div className="farmos-capacity__scenario-fields">
          <input
            type="text"
            placeholder="What are you scaling? e.g. Goats"
            value={scenarioLabel}
            onChange={(e) => setScenarioLabel(e.target.value)}
          />
          <input
            type="number"
            placeholder="Current count"
            value={currentCount}
            onChange={(e) => setCurrentCount(e.target.value)}
          />
          <input
            type="number"
            placeholder="Proposed count"
            value={proposedCount}
            onChange={(e) => setProposedCount(e.target.value)}
            required
          />
        </div>

        <div className="farmos-capacity__constraints">
          {constraints.map((c, i) => (
            <div key={i} className="farmos-capacity__constraint-row">
              <input
                type="text"
                placeholder="Constraint name"
                value={c.name}
                onChange={(e) => updateConstraint(i, "name", e.target.value)}
              />
              <input
                type="number"
                placeholder="Capacity (count supported)"
                value={c.capacity}
                onChange={(e) => updateConstraint(i, "capacity", e.target.value)}
              />
              <label className="farmos-capacity__measured-toggle">
                <input
                  type="checkbox"
                  checked={c.measured}
                  onChange={(e) => updateConstraint(i, "measured", e.target.checked)}
                />
                Measured
              </label>
              <button type="button" onClick={() => removeConstraint(i)}>
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="farmos-capacity__actions">
          <button type="button" onClick={addConstraint}>
            + Add constraint
          </button>
          <label className="farmos-capacity__stretch-input">
            Stretch multiplier
            <input
              type="number"
              step="0.1"
              value={stretchMultiplier}
              onChange={(e) => setStretchMultiplier(e.target.value)}
            />
          </label>
          <button type="submit" className="farmos-capacity__calculate">
            Calculate
          </button>
        </div>
      </form>

      {result?.error && <p className="farmos-capacity__error">{result.error}</p>}

      {result && !result.error && (
        <div className={`farmos-capacity__result farmos-capacity__result--${result.level}`}>
          <h2>{LEVEL_LABEL[result.level]}</h2>
          {scenarioLabel && (
            <p className="farmos-capacity__result-scenario">
              {currentCount || "0"} → {proposedCount} {scenarioLabel}
            </p>
          )}
          <p className="farmos-capacity__result-line">
            Bottleneck: <strong>{result.bottleneck.name}</strong> supports up to{" "}
            <strong>{result.safeCapacity}</strong>
            {result.bottleneck.measured ? " (measured)" : " (estimated)"}
          </p>
          <p className="farmos-capacity__result-line">
            Stretch capacity: {result.stretchCapacity.toFixed(1)}
          </p>

          <ul className="farmos-capacity__breakdown">
            {result.allConstraints.map((c, i) => (
              <li key={i}>
                {c.name}: {c.capacity} {c.measured ? "(measured)" : "(estimated)"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Capacity;
