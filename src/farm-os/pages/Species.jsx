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

const VARIANT_TYPE_OPTIONS = ["breed", "variety", "strain", "cultivar", "type"];


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
  const [speciesSearch, setSpeciesSearch] = useState("");
  const [showNewSpeciesConfig, setShowNewSpeciesConfig] = useState(false);

  const [newVariant, setNewVariant] = useState({
    speciesConfigId: "",
    name: "",
    variantType: "type",
  });

  const [savingVariant, setSavingVariant] = useState(false);

  const [newSpecies, setNewSpecies] = useState({
    name: "",
    category: "poultry",
    capabilities: emptyCapabilitySet(),
    spaceUnit: "",
    feedUnit: "",
    trackingModes: ["group"],
  });
  const [savingSpecies, setSavingSpecies] = useState(false);

  const [editingSpeciesId, setEditingSpeciesId] = useState(null);
  const [editingCapabilities, setEditingCapabilities] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  

  const [newEntity, setNewEntity] = useState({
    speciesConfigId: "",
    variantId: "",
    trackingMode: "group",
    entityCode: "",
    entityName: "",
    quantity: "",
    acquiredAt: "",
    location: "",
    notes: "",
  });
  const [savingEntity, setSavingEntity] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [variants, setVariants] = useState([]);

  async function loadAll() {
    setLoading(true);
    setLoadError("");

    const [speciesRes, entitiesRes, variantsRes] = await Promise.all([
      supabase.from("species_config").select("*").order("name"),

      supabase
        .from("farm_entities")
        .select(
          `id, label, quantity, status, entity_code, entity_name, tracking_mode, variant:variant_id(id, name, variant_type), species_config:species_config_id(id, name)`,
        )
        .order("label"),

      supabase
        .from("species_variants")
        .select("id, species_config_id, name, variant_type")
        .order("name"),
    ]);

    if (speciesRes.error || entitiesRes.error || variantsRes.error) {
      setLoadError(
        speciesRes.error?.message ??
          entitiesRes.error?.message ??
          variantsRes.error?.message ??
          "Something went wrong loading species and farm entities.",
      );

      setLoading(false);
      return;
    }

    setSpeciesList(speciesRes.data ?? []);
    setEntities(entitiesRes.data ?? []);
    setVariants(variantsRes.data ?? []);
    setLoading(false);
  }

  function getVariantsForSpecies(speciesConfigId) {
    return variants.filter(
      (variant) => variant.species_config_id === speciesConfigId,
    );
  }
  function getTrackingModesForSpecies(speciesConfigId) {
    const species = speciesList.find((item) => item.id === speciesConfigId);

    return species?.tracking_modes ?? ["group"];
  }
  function findSpeciesByName(name) {
    const normalized = name.trim().toLowerCase();

    return speciesList.find(
      (species) => species.name.trim().toLowerCase() === normalized,
    );
  }

  function handleVariantSpeciesChange(value) {
    const existingSpecies = findSpeciesByName(value);

    setNewVariant((prev) => ({
      ...prev,
      speciesConfigId: existingSpecies?.id ?? "",
    }));
  }

  function handleSpeciesSearchChange(value) {
    setSpeciesSearch(value);

    const existingSpecies = findSpeciesByName(value);

    if (existingSpecies) {
      const allowedModes = existingSpecies.tracking_modes ?? ["group"];

      setNewEntity((prev) => ({
        ...prev,
        speciesConfigId: existingSpecies.id,
        variantId: "",
        trackingMode: allowedModes[0] ?? "group",
      }));

      setShowNewSpeciesConfig(false);
    } else {
      setNewEntity((prev) => ({
        ...prev,
        speciesConfigId: "",
        variantId: "",
      }));

      setShowNewSpeciesConfig(value.trim().length > 0);
    }
  }

  // function handleEntitySpeciesChange(speciesConfigId) {
  //   const allowedModes = getTrackingModesForSpecies(speciesConfigId);

  //   setNewEntity((prev) => ({
  //     ...prev,
  //     speciesConfigId,
  //     variantId: "",
  //     trackingMode: allowedModes[0] ?? "group",
  //   }));
  // }

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

    const trackingModes =
      newSpecies.trackingModes?.length > 0
        ? newSpecies.trackingModes
        : ["group"];

    const { error } = await supabase.from("species_config").insert({
      name: newSpecies.name.trim(),
      category: newSpecies.category,
      capabilities: capabilitiesToPayload(newSpecies.capabilities),
      space_unit: newSpecies.spaceUnit || null,
      feed_unit: newSpecies.feedUnit || null,
      tracking_modes: trackingModes,
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
      trackingModes: ["group"],
    });
    loadAll();
  }
  async function handleAddVariant(e) {
    e.preventDefault();

    const name = newVariant.name.trim();

    if (!newVariant.speciesConfigId || !name) {
      return;
    }

    setSavingVariant(true);
    setPageError("");

    const { error } = await supabase.from("species_variants").insert({
      species_config_id: newVariant.speciesConfigId,
      name,
      variant_type: newVariant.variantType,
    });

    setSavingVariant(false);

    if (error) {
      setPageError(error.message);
      return;
    }

    setNewVariant({
      speciesConfigId: "",
      name: "",
      variantType: "type",
    });

    loadAll();
  }

  async function handleCreateSpeciesForEntity() {
    const name = speciesSearch.trim();

    if (!name) {
      return;
    }

    const existingSpecies = findSpeciesByName(name);

    if (existingSpecies) {
      const allowedModes = existingSpecies.tracking_modes ?? ["group"];

      setNewEntity((prev) => ({
        ...prev,
        speciesConfigId: existingSpecies.id,
        variantId: "",
        trackingMode: allowedModes[0] ?? "group",
      }));

      setShowNewSpeciesConfig(false);
      return;
    }

    setSavingSpecies(true);
    setPageError("");

    const trackingModes =
      newSpecies.trackingModes?.length > 0
        ? newSpecies.trackingModes
        : ["group"];

    const { data, error } = await supabase
      .from("species_config")
      .insert({
        name,
        category: newSpecies.category,
        capabilities: capabilitiesToPayload(newSpecies.capabilities),
        space_unit: newSpecies.spaceUnit || null,
        feed_unit: newSpecies.feedUnit || null,
        tracking_modes: trackingModes,
      })
      .select()
      .single();

    setSavingSpecies(false);

    if (error) {
      setPageError(error.message);
      return;
    }

    setSpeciesList((prev) =>
      [...prev, data].sort((a, b) => a.name.localeCompare(b.name)),
    );

    setNewEntity((prev) => ({
      ...prev,
      speciesConfigId: data.id,
      variantId: "",
      trackingMode: data.tracking_modes?.[0] ?? "group",
    }));

    setSpeciesSearch(data.name);
    setShowNewSpeciesConfig(false);

    setNewSpecies({
      name: "",
      category: "poultry",
      capabilities: emptyCapabilitySet(),
      spaceUnit: "",
      feedUnit: "",
      trackingModes: ["group"],
    });
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

    if (!newEntity.speciesConfigId || !newEntity.entityName.trim()) {
      return;
    }

    setSavingEntity(true);
    setPageError("");

    const quantity =
      newEntity.quantity === "" ? null : Number(newEntity.quantity);

    if (quantity !== null && (!Number.isFinite(quantity) || quantity < 0)) {
      setPageError("Quantity must be a valid non-negative number.");
      setSavingEntity(false);
      return;
    }

    const { error } = await supabase.from("farm_entities").insert({
      species_config_id: newEntity.speciesConfigId,
      variant_id: newEntity.variantId || null,
      tracking_mode: newEntity.trackingMode,
      entity_code: newEntity.entityCode.trim() || null,
      entity_name: newEntity.entityName.trim(),
      label: newEntity.entityName.trim(),
      quantity,
      acquired_at: newEntity.acquiredAt || null,
      location: newEntity.location.trim() || null,
      notes: newEntity.notes.trim() || null,
      status: "active",
    });

    setSavingEntity(false);

    if (error) {
      setPageError(error.message);
      return;
    }

    setNewEntity({
      speciesConfigId: "",
      variantId: "",
      trackingMode: "group",
      entityCode: "",
      entityName: "",
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
        Adding a new animal or crop happens here — no code change needed.
        Configure the species/crop first, then register your actual entity
        against it.
      </p>

      {pageError && (
        <p className="farmos-species__status farmos-species__status--error">
          {pageError}
        </p>
      )}

      {/* --- Species / crop configuration --- */}
      <section className="farmos-species__section">
        <h2 className="farmos-species__section-title">Species & crops</h2>

        <div className="farmos-species__list">
          {speciesList.map((species) => (
            <div key={species.id} className="farmos-species-row">
              <div className="farmos-species-row__header">
                <span className="farmos-species-row__name">{species.name}</span>
                <span className="farmos-species-row__category">
                  {species.category}
                </span>
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
                    <button
                      type="button"
                      onClick={() => setEditingSpeciesId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="farmos-species-row__capabilities">
                    {Object.keys(species.capabilities ?? {}).length === 0 ? (
                      <span className="farmos-species-row__none">
                        No capabilities set
                      </span>
                    ) : (
                      Object.keys(species.capabilities).map((key) => (
                        <span key={key} className="farmos-species-row__cap-tag">
                          {CAPABILITY_OPTIONS.find((c) => c.key === key)
                            ?.label ?? key}
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

          <div className="farmos-form-grid">
            <div className="farmos-form-field">
              <label htmlFor="species-name">Species / crop name</label>
              <input
                id="species-name"
                type="text"
                placeholder="e.g. Duck"
                value={newSpecies.name}
                onChange={(e) =>
                  setNewSpecies((p) => ({ ...p, name: e.target.value }))
                }
                required
              />
            </div>

            <div className="farmos-form-field">
              <label htmlFor="species-category">Category</label>
              <select
                id="species-category"
                value={newSpecies.category}
                onChange={(e) =>
                  setNewSpecies((p) => ({ ...p, category: e.target.value }))
                }
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="farmos-form-field">
              <label htmlFor="species-space-unit">Space unit</label>
              <input
                id="species-space-unit"
                type="text"
                placeholder="e.g. sq ft, decimal"
                value={newSpecies.spaceUnit}
                onChange={(e) =>
                  setNewSpecies((p) => ({ ...p, spaceUnit: e.target.value }))
                }
              />
            </div>

            <div className="farmos-form-field">
              <label htmlFor="species-feed-unit">Feed unit</label>
              <input
                id="species-feed-unit"
                type="text"
                placeholder="e.g. kg/day"
                value={newSpecies.feedUnit}
                onChange={(e) =>
                  setNewSpecies((p) => ({ ...p, feedUnit: e.target.value }))
                }
              />
            </div>
          </div>

          <fieldset className="farmos-capability-fieldset">
            <legend>Tracking modes</legend>

            <div className="farmos-species__add-capabilities">
              {["individual", "group", "area"].map((mode) => (
                <label key={mode}>
                  <input
                    type="checkbox"
                    checked={newSpecies.trackingModes.includes(mode)}
                    onChange={() =>
                      setNewSpecies((prev) => {
                        const exists = prev.trackingModes.includes(mode);

                        const nextModes = exists
                          ? prev.trackingModes.filter((item) => item !== mode)
                          : [...prev.trackingModes, mode];

                        return {
                          ...prev,
                          trackingModes: nextModes,
                        };
                      })
                    }
                  />

                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="farmos-capability-fieldset">
            <legend>Capabilities</legend>

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
          </fieldset>

          <button type="submit" disabled={savingSpecies}>
            {savingSpecies ? "Adding…" : "Add species"}
          </button>
        </form>
      </section>

      <section className="farmos-species__section">
        <h2 className="farmos-species__section-title">
          Breeds, varieties & types
        </h2>

        <p className="farmos-form__intro">
          Add reusable breeds, varieties, strains, cultivars, or types to your
          configured species and crops.
        </p>

        <div className="farmos-variant-list">
          {speciesList.map((species) => {
            const speciesVariants = getVariantsForSpecies(species.id);

            return (
              <div key={species.id} className="farmos-variant-group">
                <div className="farmos-variant-group__header">
                  <strong>{species.name}</strong>
                  <span>
                    {speciesVariants.length}{" "}
                    {speciesVariants.length === 1 ? "variant" : "variants"}
                  </span>
                </div>

                {speciesVariants.length > 0 ? (
                  <div className="farmos-variant-group__list">
                    {speciesVariants.map((variant) => (
                      <div key={variant.id} className="farmos-variant-item">
                        <span className="farmos-variant-item__name">
                          {variant.name}
                        </span>

                        <span className="farmos-variant-item__type">
                          {variant.variant_type}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="farmos-species-row__none">
                    No variants configured
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <form className="farmos-species__add-form" onSubmit={handleAddVariant}>
          <h3>Add a breed, variety or type</h3>

          <div className="farmos-form-grid">
            <div className="farmos-form-field farmos-form-field--wide">
              <label htmlFor="variant-species">Species / crop</label>

              <input
                id="variant-species"
                type="text"
                list="farm-os-variant-species-options"
                placeholder="Type or select a species/crop"
                value={
                  speciesList.find(
                    (species) => species.id === newVariant.speciesConfigId,
                  )?.name ?? ""
                }
                onChange={(e) => handleVariantSpeciesChange(e.target.value)}
                required
              />

              <datalist id="farm-os-variant-species-options">
                {speciesList.map((species) => (
                  <option key={species.id} value={species.name} />
                ))}
              </datalist>

              {newVariant.speciesConfigId === "" && speciesList.length > 0 && (
                <span className="farmos-form-help">
                  Select an existing species or crop to add a variant.
                </span>
              )}
            </div>

            <div className="farmos-form-field">
              <label htmlFor="variant-type">Variant type</label>

              <select
                id="variant-type"
                value={newVariant.variantType}
                onChange={(e) =>
                  setNewVariant((prev) => ({
                    ...prev,
                    variantType: e.target.value,
                  }))
                }
              >
                {VARIANT_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="farmos-form-field">
              <label htmlFor="variant-name">Variant name</label>

              <input
                id="variant-name"
                type="text"
                placeholder="e.g. Sonali"
                value={newVariant.name}
                onChange={(e) =>
                  setNewVariant((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                required
              />
            </div>
          </div>

          <button type="submit" disabled={savingVariant}>
            {savingVariant ? "Adding…" : "Add variant"}
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
                <span className="farmos-entity-row__label">
                  {entity.entity_code ?? "No code"} ·{" "}
                  {entity.entity_name ?? entity.label}
                </span>

                <span className="farmos-entity-row__species">
                  {entity.species_config?.name}
                  {entity.variant?.name ? ` · ${entity.variant.name}` : ""}
                  {entity.tracking_mode ? ` · ${entity.tracking_mode}` : ""}
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

          <p className="farmos-form__intro">
            Register an animal, group, crop plot, or other farm entity.
          </p>

          <div className="farmos-form-grid">
            {/* Species */}
            <div className="farmos-form-field farmos-form-field--wide">
              <label htmlFor="entity-species">Species / crop</label>

              <input
                id="entity-species"
                type="text"
                list="farm-os-entity-species-options"
                placeholder="Type or select a species/crop"
                value={speciesSearch}
                onChange={(e) => handleSpeciesSearchChange(e.target.value)}
                required
              />

              <datalist id="farm-os-entity-species-options">
                {speciesList.map((species) => (
                  <option key={species.id} value={species.name} />
                ))}
              </datalist>

              {speciesSearch.trim() && !newEntity.speciesConfigId && (
                <button
                  type="button"
                  className="farmos-form-inline-action"
                  onClick={() => setShowNewSpeciesConfig(true)}
                >
                  + Create "{speciesSearch.trim()}" as a new species
                </button>
              )}
            </div>

            {showNewSpeciesConfig && !newEntity.speciesConfigId && (
              <div className="farmos-new-species-config">
                <div className="farmos-new-species-config__header">
                  <div>
                    <h4>Create new species</h4>

                    <p>
                      Configure "{speciesSearch.trim()}" before registering the
                      entity.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="farmos-new-species-config__close"
                    onClick={() => setShowNewSpeciesConfig(false)}
                  >
                    Cancel
                  </button>
                </div>

                <div className="farmos-form-grid">
                  <div className="farmos-form-field">
                    <label htmlFor="inline-species-category">Category</label>

                    <select
                      id="inline-species-category"
                      value={newSpecies.category}
                      onChange={(e) =>
                        setNewSpecies((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                    >
                      {CATEGORY_OPTIONS.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="farmos-form-field">
                    <label htmlFor="inline-species-space-unit">
                      Space unit
                    </label>

                    <input
                      id="inline-species-space-unit"
                      type="text"
                      placeholder="e.g. sq ft, decimal"
                      value={newSpecies.spaceUnit}
                      onChange={(e) =>
                        setNewSpecies((prev) => ({
                          ...prev,
                          spaceUnit: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="farmos-form-field">
                    <label htmlFor="inline-species-feed-unit">Feed unit</label>

                    <input
                      id="inline-species-feed-unit"
                      type="text"
                      placeholder="e.g. kg/day"
                      value={newSpecies.feedUnit}
                      onChange={(e) =>
                        setNewSpecies((prev) => ({
                          ...prev,
                          feedUnit: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <fieldset className="farmos-capability-fieldset">
                  <legend>Tracking modes</legend>

                  <div className="farmos-species__add-capabilities">
                    {["individual", "group", "area"].map((mode) => (
                      <label key={mode}>
                        <input
                          type="checkbox"
                          checked={newSpecies.trackingModes.includes(mode)}
                          onChange={() =>
                            setNewSpecies((prev) => {
                              const exists = prev.trackingModes.includes(mode);

                              const nextModes = exists
                                ? prev.trackingModes.filter(
                                    (item) => item !== mode,
                                  )
                                : [...prev.trackingModes, mode];

                              return {
                                ...prev,
                                trackingModes: nextModes,
                              };
                            })
                          }
                        />

                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="farmos-capability-fieldset">
                  <legend>Capabilities</legend>

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
                </fieldset>

                <button
                  type="button"
                  onClick={handleCreateSpeciesForEntity}
                  disabled={savingSpecies}
                >
                  {savingSpecies
                    ? "Creating species…"
                    : "Create species & continue"}
                </button>
              </div>
            )}

            {/* Variant */}
            <div className="farmos-form-field">
              <label htmlFor="entity-variant">Breed / variety / type</label>

              <select
                id="entity-variant"
                value={newEntity.variantId}
                onChange={(e) =>
                  setNewEntity((prev) => ({
                    ...prev,
                    variantId: e.target.value,
                  }))
                }
                disabled={!newEntity.speciesConfigId}
              >
                <option value="">No variant / variety</option>

                {getVariantsForSpecies(newEntity.speciesConfigId).map(
                  (variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.name}
                    </option>
                  ),
                )}
              </select>
            </div>

            {/* Tracking mode */}
            <div className="farmos-form-field">
              <label htmlFor="entity-tracking-mode">Tracking mode</label>

              <select
                id="entity-tracking-mode"
                value={newEntity.trackingMode}
                onChange={(e) =>
                  setNewEntity((prev) => ({
                    ...prev,
                    trackingMode: e.target.value,
                  }))
                }
                required
              >
                {getTrackingModesForSpecies(newEntity.speciesConfigId).map(
                  (mode) => (
                    <option key={mode} value={mode}>
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </option>
                  ),
                )}
              </select>

              <span className="farmos-form-help">
                Choose how this entity will be managed.
              </span>
            </div>

            {/* Entity code */}
            <div className="farmos-form-field">
              <label htmlFor="entity-code">Entity code</label>

              <input
                id="entity-code"
                type="text"
                placeholder="e.g. G-002"
                value={newEntity.entityCode}
                onChange={(e) =>
                  setNewEntity((prev) => ({
                    ...prev,
                    entityCode: e.target.value,
                  }))
                }
              />

              <span className="farmos-form-help">
                Optional internal identifier.
              </span>
            </div>

            {/* Entity name */}
            <div className="farmos-form-field">
              <label htmlFor="entity-name">Entity name</label>

              <input
                id="entity-name"
                type="text"
                placeholder="e.g. Rani"
                value={newEntity.entityName}
                onChange={(e) =>
                  setNewEntity((prev) => ({
                    ...prev,
                    entityName: e.target.value,
                  }))
                }
                required
              />
            </div>

            {/* Quantity / area */}
            <div className="farmos-form-field">
              <label htmlFor="entity-quantity">
                {newEntity.trackingMode === "area" ? "Area / size" : "Quantity"}
              </label>

              <input
                id="entity-quantity"
                type="number"
                min="0"
                step="any"
                placeholder={
                  newEntity.trackingMode === "area" ? "e.g. 5" : "e.g. 100"
                }
                value={newEntity.quantity}
                onChange={(e) =>
                  setNewEntity((prev) => ({
                    ...prev,
                    quantity: e.target.value,
                  }))
                }
              />

              <span className="farmos-form-help">
                {newEntity.trackingMode === "area"
                  ? "Use the configured land unit for this species."
                  : newEntity.trackingMode === "individual"
                    ? "Usually 1 for an individual entity."
                    : "Number of animals or items in this group."}
              </span>
            </div>

            {/* Acquired date */}
            <div className="farmos-form-field">
              <label htmlFor="entity-acquired-at">
                Acquired / started date
              </label>

              <input
                id="entity-acquired-at"
                type="date"
                value={newEntity.acquiredAt}
                onChange={(e) =>
                  setNewEntity((prev) => ({
                    ...prev,
                    acquiredAt: e.target.value,
                  }))
                }
              />
            </div>

            {/* Location */}
            <div className="farmos-form-field">
              <label htmlFor="entity-location">Location</label>

              <input
                id="entity-location"
                type="text"
                placeholder="e.g. Goat shed"
                value={newEntity.location}
                onChange={(e) =>
                  setNewEntity((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
              />
            </div>

            {/* Notes */}
            <div className="farmos-form-field farmos-form-field--full">
              <label htmlFor="entity-notes">Notes</label>

              <textarea
                id="entity-notes"
                placeholder="Optional notes about this entity"
                value={newEntity.notes}
                onChange={(e) =>
                  setNewEntity((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                rows="3"
              />
            </div>
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