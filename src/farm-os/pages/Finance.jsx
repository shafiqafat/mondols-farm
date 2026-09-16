import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { computeTotals, computeCostPerUnit, splitByPercent } from "../engines/financeEngine";
import "./Finance.css";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function Finance() {
  const [projects, setProjects] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [entities, setEntities] = useState([]);
  const [harvestByEntity, setHarvestByEntity] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pageError, setPageError] = useState("");

  const [newProject, setNewProject] = useState({ name: "", startedAt: todayISO() });
  const [savingProject, setSavingProject] = useState(false);

  const [txn, setTxn] = useState({
    type: "expense",
    amount: "",
    category: "",
    projectId: "",
    entityId: "",
    date: todayISO(),
    notes: "",
  });
  const [savingTxn, setSavingTxn] = useState(false);

  const [assignSelection, setAssignSelection] = useState({});

  const [split, setSplit] = useState({
    amount: "",
    category: "",
    date: todayISO(),
    allocations: [{ projectId: "", percent: "" }],
  });
  const [savingSplit, setSavingSplit] = useState(false);

  async function loadAll() {
    setLoading(true);
    setLoadError("");

    const [projectsRes, txnRes, entitiesRes, harvestRes] = await Promise.all([
      supabase.from("farm_projects").select("*").order("name"),
      supabase.from("finance_transactions").select("*").order("occurred_at", { ascending: false }),
      supabase
        .from("farm_entities")
        .select("id, label, project_id, species_config:species_config_id(name)")
        .order("label"),
      supabase.from("entity_events").select("entity_id, payload").eq("type", "harvest"),
    ]);

    if (projectsRes.error) {
      setLoadError(projectsRes.error.message);
      setLoading(false);
      return;
    }

    setProjects(projectsRes.data ?? []);
    setTransactions(txnRes.data ?? []);
    setEntities(entitiesRes.data ?? []);

    const harvestTotals = {};
    for (const row of harvestRes.data ?? []) {
      const amt = Number(row.payload?.amount ?? 0);
      harvestTotals[row.entity_id] = (harvestTotals[row.entity_id] ?? 0) + amt;
    }
    setHarvestByEntity(harvestTotals);

    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
  }, []);

  async function handleAddProject(e) {
    e.preventDefault();
    if (!newProject.name.trim()) return;
    setSavingProject(true);
    setPageError("");

    const { error } = await supabase.from("farm_projects").insert({
      name: newProject.name.trim(),
      started_at: newProject.startedAt || null,
      status: "active",
    });

    setSavingProject(false);
    if (error) {
      setPageError(error.message);
      return;
    }
    setNewProject({ name: "", startedAt: todayISO() });
    loadAll();
  }

  async function handleAddTransaction(e) {
    e.preventDefault();
    const amount = Number(txn.amount);
    if (!amount || amount <= 0) {
      setPageError("Enter a valid amount.");
      return;
    }
    setSavingTxn(true);
    setPageError("");

    const { error } = await supabase.from("finance_transactions").insert({
      type: txn.type,
      amount,
      category: txn.category || null,
      project_id: txn.projectId || null,
      entity_id: txn.entityId || null,
      occurred_at: txn.date,
      notes: txn.notes || null,
    });

    setSavingTxn(false);
    if (error) {
      setPageError(error.message);
      return;
    }
    setTxn({ type: "expense", amount: "", category: "", projectId: "", entityId: "", date: todayISO(), notes: "" });
    loadAll();
  }

  async function handleAssignEntity(projectId) {
    const entityId = assignSelection[projectId];
    if (!entityId) return;
    const { error } = await supabase
      .from("farm_entities")
      .update({ project_id: projectId })
      .eq("id", entityId);
    if (error) {
      setPageError(error.message);
      return;
    }
    setAssignSelection((prev) => ({ ...prev, [projectId]: "" }));
    loadAll();
  }

  function updateAllocation(index, field, value) {
    setSplit((prev) => {
      const allocations = [...prev.allocations];
      allocations[index] = { ...allocations[index], [field]: value };
      return { ...prev, allocations };
    });
  }

  function addAllocationRow() {
    setSplit((prev) => ({ ...prev, allocations: [...prev.allocations, { projectId: "", percent: "" }] }));
  }

  function removeAllocationRow(index) {
    setSplit((prev) => ({ ...prev, allocations: prev.allocations.filter((_, i) => i !== index) }));
  }

  async function handleSaveSplit(e) {
    e.preventDefault();
    const total = Number(split.amount);
    const percentSum = split.allocations.reduce((s, a) => s + Number(a.percent || 0), 0);

    if (!total || total <= 0) {
      setPageError("Enter a valid total amount for the shared expense.");
      return;
    }
    if (Math.round(percentSum) !== 100) {
      setPageError(`Allocation percentages must add up to 100 (currently ${percentSum}).`);
      return;
    }
    if (split.allocations.some((a) => !a.projectId)) {
      setPageError("Every allocation row needs a project selected.");
      return;
    }

    setSavingSplit(true);
    setPageError("");

    const rows = splitByPercent(total, split.allocations).map((r) => ({
      type: "expense",
      amount: r.amount,
      category: split.category ? `${split.category} (shared)` : "Shared expense",
      project_id: r.projectId,
      occurred_at: split.date,
    }));

    const { error } = await supabase.from("finance_transactions").insert(rows);
    setSavingSplit(false);
    if (error) {
      setPageError(error.message);
      return;
    }

    setSplit({ amount: "", category: "", date: todayISO(), allocations: [{ projectId: "", percent: "" }] });
    loadAll();
  }

  if (loading) return <p className="farmos-finance__status">Loading finance data…</p>;
  if (loadError)
    return <p className="farmos-finance__status farmos-finance__status--error">{loadError}</p>;

  const unassignedEntities = entities.filter((e) => !e.project_id);
  const unassignedTransactions = transactions.filter((t) => !t.project_id);

  return (
    <div className="farmos-finance">
      <h1 className="farmos-finance__title">Finance</h1>

      {pageError && (
        <p className="farmos-finance__status farmos-finance__status--error">{pageError}</p>
      )}

      <section className="farmos-finance__section">
        <h2>Projects</h2>
        <div className="farmos-finance__projects">
          {projects.map((project) => {
            const projectTxns = transactions.filter((t) => t.project_id === project.id);
            const totals = computeTotals(projectTxns);
            const projectEntities = entities.filter((e) => e.project_id === project.id);
            const totalYield = projectEntities.reduce(
              (sum, e) => sum + (harvestByEntity[e.id] ?? 0),
              0
            );
            const costPerUnit = computeCostPerUnit(totals.expense, totalYield);

            return (
              <div key={project.id} className="farmos-project-card">
                <div className="farmos-project-card__header">
                  <span className="farmos-project-card__name">{project.name}</span>
                  <span className="farmos-project-card__net">
                    Net ৳{totals.net.toFixed(2)}
                  </span>
                </div>

                <div className="farmos-project-card__totals">
                  <span>Income ৳{totals.income.toFixed(2)}</span>
                  <span>Expense ৳{totals.expense.toFixed(2)}</span>
                  <span>Assets ৳{totals.asset.toFixed(2)}</span>
                </div>

                {totalYield > 0 && (
                  <p className="farmos-project-card__cost-per-unit">
                    Yield: {totalYield.toFixed(2)} · Cost/unit: ৳
                    {costPerUnit != null ? costPerUnit.toFixed(2) : "—"} (cash costs only)
                  </p>
                )}

                <div className="farmos-project-card__entities">
                  {projectEntities.length === 0 ? (
                    <span className="farmos-project-card__no-entities">No entities assigned</span>
                  ) : (
                    projectEntities.map((e) => (
                      <span key={e.id} className="farmos-project-card__entity-tag">
                        {e.label}
                      </span>
                    ))
                  )}
                </div>

                {unassignedEntities.length > 0 && (
                  <div className="farmos-project-card__assign">
                    <select
                      value={assignSelection[project.id] ?? ""}
                      onChange={(e) =>
                        setAssignSelection((prev) => ({ ...prev, [project.id]: e.target.value }))
                      }
                    >
                      <option value="">Assign entity…</option>
                      {unassignedEntities.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.label}
                        </option>
                      ))}
                    </select>
                    <button type="button" onClick={() => handleAssignEntity(project.id)}>
                      Assign
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <form className="farmos-finance__add-form" onSubmit={handleAddProject}>
          <h3>New project</h3>
          <div className="farmos-finance__add-fields">
            <input
              type="text"
              placeholder="Project name, e.g. Mustard Project #001"
              value={newProject.name}
              onChange={(e) => setNewProject((p) => ({ ...p, name: e.target.value }))}
              required
            />
            <input
              type="date"
              value={newProject.startedAt}
              onChange={(e) => setNewProject((p) => ({ ...p, startedAt: e.target.value }))}
            />
            <button type="submit" disabled={savingProject}>
              {savingProject ? "Adding…" : "Add project"}
            </button>
          </div>
        </form>
      </section>

      <section className="farmos-finance__section">
        <h2>Add a transaction</h2>
        <form className="farmos-finance__add-form" onSubmit={handleAddTransaction}>
          <div className="farmos-finance__add-fields">
            <select value={txn.type} onChange={(e) => setTxn((p) => ({ ...p, type: e.target.value }))}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="asset">Asset purchase</option>
            </select>
            <input
              type="number"
              step="any"
              placeholder="Amount (৳)"
              value={txn.amount}
              onChange={(e) => setTxn((p) => ({ ...p, amount: e.target.value }))}
              required
            />
            <input
              type="text"
              placeholder="Category"
              value={txn.category}
              onChange={(e) => setTxn((p) => ({ ...p, category: e.target.value }))}
            />
            <select
              value={txn.projectId}
              onChange={(e) => setTxn((p) => ({ ...p, projectId: e.target.value }))}
            >
              <option value="">No project (general)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              value={txn.entityId}
              onChange={(e) => setTxn((p) => ({ ...p, entityId: e.target.value }))}
            >
              <option value="">No entity</option>
              {entities.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.label}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={txn.date}
              onChange={(e) => setTxn((p) => ({ ...p, date: e.target.value }))}
            />
          </div>
          <button type="submit" disabled={savingTxn}>
            {savingTxn ? "Saving…" : "Add transaction"}
          </button>
        </form>
      </section>

      <section className="farmos-finance__section">
        <h2>Shared expense (split across projects)</h2>
        <p className="farmos-finance__hint">
          For a cost that isn't one project's alone — e.g. shared labour or electricity. Enter
          the total and how it splits by percentage.
        </p>
        <form className="farmos-finance__add-form" onSubmit={handleSaveSplit}>
          <div className="farmos-finance__add-fields">
            <input
              type="number"
              step="any"
              placeholder="Total amount (৳)"
              value={split.amount}
              onChange={(e) => setSplit((p) => ({ ...p, amount: e.target.value }))}
            />
            <input
              type="text"
              placeholder="Category, e.g. labour"
              value={split.category}
              onChange={(e) => setSplit((p) => ({ ...p, category: e.target.value }))}
            />
            <input
              type="date"
              value={split.date}
              onChange={(e) => setSplit((p) => ({ ...p, date: e.target.value }))}
            />
          </div>

          {split.allocations.map((alloc, i) => (
            <div key={i} className="farmos-finance__allocation-row">
              <select
                value={alloc.projectId}
                onChange={(e) => updateAllocation(i, "projectId", e.target.value)}
              >
                <option value="">Project…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="%"
                value={alloc.percent}
                onChange={(e) => updateAllocation(i, "percent", e.target.value)}
              />
              {split.allocations.length > 1 && (
                <button type="button" onClick={() => removeAllocationRow(i)}>
                  Remove
                </button>
              )}
            </div>
          ))}

          <div className="farmos-finance__split-actions">
            <button type="button" onClick={addAllocationRow}>
              + Add project
            </button>
            <button type="submit" disabled={savingSplit}>
              {savingSplit ? "Saving…" : "Save split expense"}
            </button>
          </div>
        </form>
      </section>

      <section className="farmos-finance__section">
        <h2>General transactions (no project)</h2>
        {unassignedTransactions.length === 0 ? (
          <p className="farmos-finance__status">None yet.</p>
        ) : (
          <ul className="farmos-finance__txn-list">
            {unassignedTransactions.slice(0, 20).map((t) => (
              <li key={t.id}>
                <span>{t.occurred_at}</span>
                <span className={`farmos-finance__txn-type farmos-finance__txn-type--${t.type}`}>
                  {t.type}
                </span>
                <span>{t.category ?? "—"}</span>
                <span>৳{Number(t.amount).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default Finance;
