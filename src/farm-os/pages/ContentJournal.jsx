import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { STAGES, STAGE_LABEL, nextStage } from "../engines/contentJournalEngine";
import "./ContentJournal.css";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function ContentJournal() {
  const [items, setItems] = useState([]);
  const [entities, setEntities] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pageError, setPageError] = useState("");

  const [form, setForm] = useState({
    title: "",
    type: "mixed",
    entityId: "",
    projectId: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [advancingId, setAdvancingId] = useState(null);

  async function loadAll() {
    setLoading(true);
    setLoadError("");

    const [itemsRes, entitiesRes, projectsRes] = await Promise.all([
      supabase
        .from("content_items")
        .select("*, entity:entity_id(label), project:project_id(name)")
        .order("created_at", { ascending: false }),
      supabase.from("farm_entities").select("id, label").order("label"),
      supabase.from("farm_projects").select("id, name").order("name"),
    ]);

    if (itemsRes.error) {
      setLoadError(itemsRes.error.message);
      setLoading(false);
      return;
    }

    setItems(itemsRes.data ?? []);
    setEntities(entitiesRes.data ?? []);
    setProjects(projectsRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setPageError("");

    const { error } = await supabase.from("content_items").insert({
      title: form.title.trim(),
      type: form.type,
      entity_id: form.entityId || null,
      project_id: form.projectId || null,
      notes: form.notes || null,
      stage: "idea",
      occurred_at: todayISO(),
    });

    setSaving(false);
    if (error) {
      setPageError(error.message);
      return;
    }
    setForm({ title: "", type: "mixed", entityId: "", projectId: "", notes: "" });
    loadAll();
  }

  async function handleAdvance(item) {
    const next = nextStage(item.stage);
    if (!next) return;
    setAdvancingId(item.id);
    const { error } = await supabase
      .from("content_items")
      .update({ stage: next })
      .eq("id", item.id);
    setAdvancingId(null);
    if (error) {
      setPageError(error.message);
      return;
    }
    loadAll();
  }

  if (loading) return <p className="farmos-content__status">Loading…</p>;
  if (loadError)
    return <p className="farmos-content__status farmos-content__status--error">{loadError}</p>;

  return (
    <div className="farmos-content">
      <h1 className="farmos-content__title">Content Journal</h1>
      <p className="farmos-content__intro">
        Idea → Captured → Editing → Published — every piece optionally linked back to the
        entity or project it's about.
      </p>

      {pageError && (
        <p className="farmos-content__status farmos-content__status--error">{pageError}</p>
      )}

      <div className="farmos-content__board">
        {STAGES.map((stage) => (
          <div key={stage} className="farmos-content__column">
            <h2>{STAGE_LABEL[stage]}</h2>
            {items.filter((i) => i.stage === stage).length === 0 ? (
              <p className="farmos-content__empty">Nothing here yet.</p>
            ) : (
              items
                .filter((i) => i.stage === stage)
                .map((item) => {
                  const next = nextStage(item.stage);
                  return (
                    <div key={item.id} className="farmos-content-card">
                      <span className="farmos-content-card__title">{item.title}</span>
                      <span className="farmos-content-card__meta">
                        {item.type}
                        {item.entity ? ` · ${item.entity.label}` : ""}
                        {item.project ? ` · ${item.project.name}` : ""}
                      </span>
                      {item.notes && <p className="farmos-content-card__notes">{item.notes}</p>}
                      {next && (
                        <button
                          type="button"
                          onClick={() => handleAdvance(item)}
                          disabled={advancingId === item.id}
                        >
                          {advancingId === item.id ? "…" : `Move to ${STAGE_LABEL[next]}`}
                        </button>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        ))}
      </div>

      <form className="farmos-content__add-form" onSubmit={handleAdd}>
        <h3>New content idea</h3>
        <div className="farmos-content__add-fields">
          <input
            type="text"
            placeholder="Title, e.g. Goat kidding day"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            required
          />
          <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
            <option value="mixed">Mixed</option>
            <option value="photo">Photo</option>
            <option value="video">Video</option>
            <option value="note">Note</option>
          </select>
          <select
            value={form.entityId}
            onChange={(e) => setForm((p) => ({ ...p, entityId: e.target.value }))}
          >
            <option value="">No entity</option>
            {entities.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
          <select
            value={form.projectId}
            onChange={(e) => setForm((p) => ({ ...p, projectId: e.target.value }))}
          >
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <input
          type="text"
          className="farmos-content__notes-input"
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
        />
        <button type="submit" disabled={saving}>
          {saving ? "Adding…" : "Add idea"}
        </button>
      </form>
    </div>
  );
}

export default ContentJournal;
