import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./Species.css";

const CAPABILITY_OPTIONS = [
  { key: "feed", label: "Feed" },
  { key: "health", label: "Health" },
  { key: "weight", label: "Weight" },
  { key: "egg", label: "Egg production" },
  { key: "breeding", label: "Breeding" },
  { key: "milk", label: "Milk" },
  { key: "harvest", label: "Harvest" },
];

const CATEGORY_OPTIONS = ["poultry", "livestock", "crop", "fodder"];
const STATUS_OPTIONS = ["active", "sold", "deceased", "harvested"];

function emptyCapabilitySet() {
  return CAPABILITY_OPTIONS.reduce((acc, c) => ({ ...acc, [c.key]: false }), {});
}

function Species() {
  const [speciesList, setSpeciesList] = useState([]);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pageError, setPageError] = useState("");

  const [newSpecies, setNewSpecies] = useState({
    name: "",
    category: "poultry",
    capabilities: emptyCapabilitySet(),
    spaceUnit: "",
    feedUnit: "",
  });
  const [savingSpecies, setSavingSpecies] = useState(false);

  const [editingSpeciesId, setEditingSpeciesId] = useState(null);
  const [editingCapabilities, setEditingCapabilities] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  const [newEntity, setNewEntity] = useState({
    speciesConfigId: "",
    label: "",
    quantity: "",
    acquiredAt: "",
    location: "",
    notes: "",
  });
  const [savingEntity, setSavingEntity] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  async function loadAll() {
    setLoading(true);
    setLoadError("");

    const [speciesRes, entitiesRes] = await Promise.all([
      supabase.from("species_config").select("*").order("name"),
      supabase
        .from("farm_entities")
        .select("id, label, quantity, status, species_config:species_config_id(id, name)")
        .order("label"),
    ]);

    if (speciesRes.error) {
      setLoadError(speciesRes.error.message);
      setLoading(false);
      return;
    }

    setSpeciesList(speciesRes.data ?? []);
    setEntities(entitiesRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
  }, []);

  function toggleNewCapability(key) {
    setNewSpecies((prev) => ({
      ...prev,
      capabilities: { ...prev.capabilities, [key]: !prev.capabilities[key] },
    }));
  }

  function capabilitiesToPayload(capMap) {
    const payload = {};
    for (const key of Object.keys(capMap)) {
      if (capMap[key]) payload[key] = {};
    }
    return payload;
  }

  async function handleAddSpecies(e) {
    e.preventDefault();
    if (!newSpecies.name.trim()) return;
    setSavingSpecies(true);
    setPageError("");

    const { error } = await supabase.from("species_config").insert({
      name: newSpecies.name.trim(),
      category: newSpecies.category,
      capabilities: capabilitiesToPayload(newSpecies.capabilities),
      space_unit: newSpecies.spaceUnit || null,
      feed_unit: newSpecies.feedUnit || null,
    });

    setSavingSpecies(false);
    if (error) {
      setPageError(error.message);
      return;
    }

    setNewSpecies({
      name: "",
      category: "poultry",
      capabilities: emptyCapabilitySet(),
      spaceUnit: "",
      feedUnit: "",
    });
    loadAll();
  }

  function startEditing(species) {
    setEditingSpeciesId(species.id);
    const capMap = emptyCapabilitySet();
    for (const key of Object.keys(species.capabilities ?? {})) {
      if (key in capMap) capMap[key] = true;
    }
    setEditingCapabilities(capMap);
  }

  async function saveEditedCapabilities(species) {
    setSavingEdit(true);
    setPageError("");

    // Preserve any richer per-capability config already stored (e.g. a
    // breeding capability with gestation_days) for keys that stay checked —
    // only add/remove keys, don't blow away existing nested config.
    const existing = species.capabilities ?? {};
    const nextCapabilities = {};
    for (const key of Object.keys(editingCapabilities)) {
      if (editingCapabilities[key]) {
        nextCapabilities[key] = existing[key] ?? {};
      }
    }

    const { error } = await supabase
      .from("species_config")
      .update({ capabilities: nextCapabilities })
      .eq("id", species.id);

    setSavingEdit(false);
    if (error) {
      setPageError(error.message);
      return;
    }
    setEditingSpeciesId(null);
    loadAll();
  }

  async function handleAddEntity(e) {
    e.preventDefault();
    if (!newEntity.speciesConfigId || !newEntity.label.trim()) return;
    setSavingEntity(true);
    setPageError("");

    const { error } = await supabase.from("farm_entities").insert({
      species_config_id: newEntity.speciesConfigId,
      label: newEntity.label.trim(),
      quantity: newEntity.quantity ? Number(newEntity.quantity) : null,
      acquired_at: newEntity.acquiredAt || null,
      location: newEntity.location || null,
      notes: newEntity.notes || null,
      status: "active",
    });

    setSavingEntity(false);
    if (error) {
      setPageError(error.message);
      return;
    }

    setNewEntity({
      speciesConfigId: "",
      label: "",
      quantity: "",
      acquiredAt: "",
      location: "",
      notes: "",
    });
    loadAll();
  }

  async function handleStatusChange(entityId, status) {
    setUpdatingStatusId(entityId);
    const { error } = await supabase
      .from("farm_entities")
      .update({ status })
      .eq("id", entityId);
    setUpdatingStatusId(null);
    if (error) {
      setPageError(error.message);
      return;
    }
    loadAll();
  }

  if (loading) return <p className="farmos-species__status">Loading…</p>;
  if (loadError)
    return <p className="farmos-species__status farmos-species__status--error">{loadError}</p>;

  return (
    <div className="farmos-species">
      <h1 className="farmos-species__title">Species & Entities</h1>
      <p className="farmos-species__intro">
        Adding a new animal or crop happens here — no code change needed. Configure the
        species/crop first, then register your actual entity against it.
      </p>

      {pageError && (
        <p className="farmos-species__status farmos-species__status--error">{pageError}</p>
      )}

      {/* --- Species / crop configuration --- */}
      <section className="farmos-species__section">
        <h2 className="farmos-species__section-title">Species & crops</h2>

        <div className="farmos-species__list">
          {speciesList.map((species) => (
            <div key={species.id} className="farmos-species-row">
              <div className="farmos-species-row__header">
                <span className="farmos-species-row__name">{species.name}</span>
                <span className="farmos-species-row__category">{species.category}</span>
              </div>

              {editingSpeciesId === species.id ? (
                <>
                  <div className="farmos-species-row__capabilities-edit">
                    {CAPABILITY_OPTIONS.map((cap) => (
                      <label key={cap.key}>
                        <input
                          type="checkbox"
                          checked={!!editingCapabilities[cap.key]}
                          onChange={() =>
                            setEditingCapabilities((prev) => ({
                              ...prev,
                              [cap.key]: !prev[cap.key],
                            }))
                          }
                        />
                        {cap.label}
                      </label>
                    ))}
                  </div>
                  <div className="farmos-species-row__actions">
                    <button
                      type="button"
                      onClick={() => saveEditedCapabilities(species)}
                      disabled={savingEdit}
                    >
                      {savingEdit ? "Saving…" : "Save"}
                    </button>
                    <button type="button" onClick={() => setEditingSpeciesId(null)}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="farmos-species-row__capabilities">
                    {Object.keys(species.capabilities ?? {}).length === 0 ? (
                      <span className="farmos-species-row__none">No capabilities set</span>
                    ) : (
                      Object.keys(species.capabilities).map((key) => (
                        <span key={key} className="farmos-species-row__cap-tag">
                          {CAPABILITY_OPTIONS.find((c) => c.key === key)?.label ?? key}
                        </span>
                      ))
                    )}
                  </div>
                  <button
                    type="button"
                    className="farmos-species-row__edit-btn"
                    onClick={() => startEditing(species)}
                  >
                    Edit capabilities
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        <form className="farmos-species__add-form" onSubmit={handleAddSpecies}>
          <h3>Add a new species or crop</h3>
          <div className="farmos-species__add-fields">
            <input
              type="text"
              placeholder="Name, e.g. Duck"
              value={newSpecies.name}
              onChange={(e) => setNewSpecies((p) => ({ ...p, name: e.target.value }))}
              required
            />
            <select
              value={newSpecies.category}
              onChange={(e) => setNewSpecies((p) => ({ ...p, category: e.target.value }))}
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Space unit, e.g. sq ft"
              value={newSpecies.spaceUnit}
              onChange={(e) => setNewSpecies((p) => ({ ...p, spaceUnit: e.target.value }))}
            />
            <input
              type="text"
              placeholder="Feed unit, e.g. kg/day"
              value={newSpecies.feedUnit}
              onChange={(e) => setNewSpecies((p) => ({ ...p, feedUnit: e.target.value }))}
            />
          </div>

          <div className="farmos-species__add-capabilities">
            {CAPABILITY_OPTIONS.map((cap) => (
              <label key={cap.key}>
                <input
                  type="checkbox"
                  checked={newSpecies.capabilities[cap.key]}
                  onChange={() => toggleNewCapability(cap.key)}
                />
                {cap.label}
              </label>
            ))}
          </div>

          <button type="submit" disabled={savingSpecies}>
            {savingSpecies ? "Adding…" : "Add species"}
          </button>
        </form>
      </section>

      {/* --- Farm entities --- */}
      <section className="farmos-species__section">
        <h2 className="farmos-species__section-title">Farm entities</h2>

        <div className="farmos-species__list">
          {entities.map((entity) => (
            <div key={entity.id} className="farmos-entity-row">
              <div>
                <span className="farmos-entity-row__label">{entity.label}</span>
                <span className="farmos-entity-row__species">
                  {entity.species_config?.name}
                  {entity.quantity != null ? ` · ${entity.quantity}` : ""}
                </span>
              </div>
              <select
                value={entity.status}
                onChange={(e) => handleStatusChange(entity.id, e.target.value)}
                disabled={updatingStatusId === entity.id}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <form className="farmos-species__add-form" onSubmit={handleAddEntity}>
          <h3>Register a new farm entity</h3>
          <div className="farmos-species__add-fields">
            <select
              value={newEntity.speciesConfigId}
              onChange={(e) => setNewEntity((p) => ({ ...p, speciesConfigId: e.target.value }))}
              required
            >
              <option value="">Select species/crop…</option>
              {speciesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Label, e.g. Duck flock — batch 1"
              value={newEntity.label}
              onChange={(e) => setNewEntity((p) => ({ ...p, label: e.target.value }))}
              required
            />
            <input
              type="number"
              step="any"
              placeholder="Quantity"
              value={newEntity.quantity}
              onChange={(e) => setNewEntity((p) => ({ ...p, quantity: e.target.value }))}
            />
            <input
              type="date"
              value={newEntity.acquiredAt}
              onChange={(e) => setNewEntity((p) => ({ ...p, acquiredAt: e.target.value }))}
            />
            <input
              type="text"
              placeholder="Location"
              value={newEntity.location}
              onChange={(e) => setNewEntity((p) => ({ ...p, location: e.target.value }))}
            />
          </div>
          <button type="submit" disabled={savingEntity}>
            {savingEntity ? "Registering…" : "Register entity"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default Species;
