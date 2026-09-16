import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./Species.css";

import EntityHistory from "../components/EntityHistory";

import {
  getDefaultEventType,
  validateEventPayload,
} from "../lib/eventUtils";

const CAPABILITY_OPTIONS = [
  { key: "feed", label: "Feed" },
  { key: "health", label: "Health" },
  { key: "weight", label: "Weight" },
  { key: "egg", label: "Egg production" },
  { key: "breeding", label: "Breeding" },
  { key: "milk", label: "Milk" },
  { key: "harvest", label: "Harvest" },
];
function emptyCapabilitySet() {
  return Object.fromEntries(
    CAPABILITY_OPTIONS.map((capability) => [capability.key, false]),
  );
}

const VARIANT_TYPE_OPTIONS = ["breed", "variety", "strain", "cultivar", "type"];

const CATEGORY_OPTIONS = ["poultry", "livestock", "crop", "fodder"];
const STATUS_OPTIONS = ["active", "sold", "deceased", "harvested"];

function Species() {
  const [speciesList, setSpeciesList] = useState([]);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pageError, setPageError] = useState("");
  const [variantSearch, setVariantSearch] = useState("");
  const [showNewVariantConfig, setShowNewVariantConfig] = useState(false);
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
  const [editingEntityId, setEditingEntityId] = useState(null);

  const [editingEntity, setEditingEntity] = useState({
    entityCode: "",
    entityName: "",
    location: "",
    notes: "",
  });
  const [savingEntity, setSavingEntity] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [selectedEntityId, setSelectedEntityId] = useState(null);
  const [entityEvents, setEntityEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [variants, setVariants] = useState([]);
  const [savingEvent, setSavingEvent] = useState(false);

  const [newEvent, setNewEvent] = useState({
    type: "other",
    occurredAt: "",
    payload: {},
    notes: "",
  });

  async function loadAll() {
    setLoading(true);
    setLoadError("");

    const [speciesRes, entitiesRes, variantsRes] = await Promise.all([
      supabase.from("species_config").select("*").order("name"),

      supabase
        .from("farm_entities")
        .select(
          `id, label, quantity, status, entity_code, entity_name,
       tracking_mode, notes, location,
       variant:variant_id(id, name, variant_type),
       species_config:species_config_id(id, name)`,
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
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
  }, []);

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
  
  function findVariantByName(name, speciesConfigId) {
    const normalized = name.trim().toLowerCase();

    return variants.find(
      (variant) =>
        variant.species_config_id === speciesConfigId &&
        variant.name.trim().toLowerCase() === normalized,
    );
  }

  function handleVariantSearchChange(value) {
    setVariantSearch(value);

    const speciesId = newEntity.speciesConfigId;

    if (!speciesId) {
      setNewEntity((prev) => ({
        ...prev,
        variantId: "",
      }));
      setShowNewVariantConfig(false);
      return;
    }

    const existingVariant = findVariantByName(value, speciesId);

    if (existingVariant) {
      setNewEntity((prev) => ({
        ...prev,
        variantId: existingVariant.id,
      }));

      setShowNewVariantConfig(false);
    } else {
      setNewEntity((prev) => ({
        ...prev,
        variantId: "",
      }));

      setShowNewVariantConfig(value.trim().length > 0);
    }
  }
  function handleEventPayloadChange(key, value) {
    setNewEvent((prev) => ({
      ...prev,
      payload: {
        ...prev.payload,
        [key]: value,
      },
    }));
  }
  function handleEventTypeChange(type) {
    setNewEvent((prev) => ({
      ...prev,
      type,
      payload: {},
    }));

    setPageError("");
  }
  async function handleAddEntityEvent(e) {
    e.preventDefault();

    if (!selectedEntityId) {
      setPageError("Please select an entity first.");
      return;
    }

    if (!newEvent.type || !newEvent.occurredAt) {
      setPageError("Event type and date are required.");
      return;
    }

    const selectedEntity = entities.find(
      (entity) => entity.id === selectedEntityId,
    );

    const validationError = validateEventPayload(
      newEvent.type,
      newEvent.payload,
      selectedEntity,
    );

    if (validationError) {
      setPageError(validationError);
      return;
    }

    setSavingEvent(true);
    setPageError("");

    const { data, error } = await supabase
      .from("entity_events")
      .insert({
        entity_id: selectedEntityId,
        type: newEvent.type,
        occurred_at: newEvent.occurredAt,
        payload: {
          ...newEvent.payload,
          notes: newEvent.notes.trim() || null,
        },
      })
      .select("id, entity_id, type, payload, occurred_at, created_at")
      .single();

    setSavingEvent(false);

    if (error) {
      setPageError(error.message);
      return;
    }

    setEntityEvents((prev) =>
      [data, ...prev].sort((a, b) => {
        const dateCompare = b.occurred_at.localeCompare(a.occurred_at);

        if (dateCompare !== 0) return dateCompare;

        return b.created_at.localeCompare(a.created_at);
      }),
    );

    setNewEvent({
      type: "other",
      occurredAt: "",
      payload: {},
      notes: "",
    });
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

      setVariantSearch("");
      setShowNewVariantConfig(false);
      setShowNewSpeciesConfig(false);
    } else {
      setNewEntity((prev) => ({
        ...prev,
        speciesConfigId: "",
        variantId: "",
      }));

      setVariantSearch("");
      setShowNewVariantConfig(false);
      setShowNewSpeciesConfig(value.trim().length > 0);
    }
  }

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
  async function handleCreateVariantForEntity() {
    const speciesId = newEntity.speciesConfigId;
    const name = newVariant.name.trim();

    if (!speciesId) {
      setPageError("Please select a species or crop first.");
      return;
    }

    if (!name) {
      setPageError("Please enter a variant name.");
      return;
    }

    const existingVariant = findVariantByName(name, speciesId);

    if (existingVariant) {
      setNewEntity((prev) => ({
        ...prev,
        variantId: existingVariant.id,
      }));

      setVariantSearch(existingVariant.name);
      setShowNewVariantConfig(false);
      return;
    }

    setSavingVariant(true);
    setPageError("");

    const { data, error } = await supabase
      .from("species_variants")
      .insert({
        species_config_id: speciesId,
        name,
        variant_type: newVariant.variantType,
      })
      .select("id, species_config_id, name, variant_type")
      .single();

    setSavingVariant(false);

    if (error) {
      setPageError(error.message);
      return;
    }

    setVariants((prev) =>
      [...prev, data].sort((a, b) => a.name.localeCompare(b.name)),
    );

    setNewEntity((prev) => ({
      ...prev,
      variantId: data.id,
    }));

    setVariantSearch(data.name);
    setShowNewVariantConfig(false);

    setNewVariant({
      speciesConfigId: speciesId,
      name: "",
      variantType: "type",
    });
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

    setSpeciesSearch("");
    setVariantSearch("");
    setShowNewSpeciesConfig(false);
    setShowNewVariantConfig(false);

    setNewVariant({
      speciesConfigId: "",
      name: "",
      variantType: "type",
    });

    loadAll();
  }

  function startEditingEntity(entity) {
    setEditingEntityId(entity.id);

    setEditingEntity({
      entityCode: entity.entity_code ?? "",
      entityName: entity.entity_name ?? entity.label ?? "",
      location: entity.location ?? "",
      notes: entity.notes ?? "",
    });
  }

  async function saveEditedEntity(entityId) {
    if (!editingEntity.entityName.trim()) {
      setPageError("Entity name is required.");
      return;
    }

    setSavingEntity(true);
    setPageError("");

    const { error } = await supabase
      .from("farm_entities")
      .update({
        entity_code: editingEntity.entityCode.trim() || null,
        entity_name: editingEntity.entityName.trim(),
        label: editingEntity.entityName.trim(),
        location: editingEntity.location.trim() || null,
        notes: editingEntity.notes.trim() || null,
      })
      .eq("id", entityId);

    setSavingEntity(false);

    if (error) {
      setPageError(error.message);
      return;
    }

    setEditingEntityId(null);

    setEditingEntity({
      entityCode: "",
      entityName: "",
      location: "",
      notes: "",
    });

    loadAll();
  }
  async function loadEntityEvents(entityId) {
    if (!entityId) {
      setEntityEvents([]);
      return;
    }

    setLoadingEvents(true);
    setPageError("");

    const { data, error } = await supabase
      .from("entity_events")
      .select("id, entity_id, type, payload, occurred_at, created_at")
      .eq("entity_id", entityId)
      .order("occurred_at", { ascending: false })
      .order("created_at", { ascending: false });

    setLoadingEvents(false);

    if (error) {
      setPageError(error.message);
      return;
    }

    setEntityEvents(data ?? []);
  }
  function handleSelectEntity(entityId) {
    const entity = entities.find((item) => item.id === entityId);

    setSelectedEntityId(entityId);

    setNewEvent({
      type: getDefaultEventType(entity, speciesList),
      occurredAt: "",
      payload: {},
      notes: "",
    });

    setPageError("");
    loadEntityEvents(entityId);
  }
  function closeEntityHistory() {
    setSelectedEntityId(null);
    setEntityEvents([]);
    setNewEvent({
      type: "other",
      occurredAt: "",
      payload: {},
      notes: "",
    });
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
            <div
              key={entity.id}
              className={`farmos-entity-row ${
                selectedEntityId === entity.id
                  ? "farmos-entity-row--selected"
                  : ""
              }`}
            >
              {/* Entity history */}
              {selectedEntityId === entity.id && (
                <EntityHistory
                  entity={entity}
                  speciesList={speciesList}
                  entityEvents={entityEvents}
                  loadingEvents={loadingEvents}
                  newEvent={newEvent}
                  savingEvent={savingEvent}
                  onClose={closeEntityHistory}
                  onSubmit={handleAddEntityEvent}
                  onTypeChange={handleEventTypeChange}
                  onDateChange={(occurredAt) =>
                    setNewEvent((prev) => ({
                      ...prev,
                      occurredAt,
                    }))
                  }
                  onPayloadChange={handleEventPayloadChange}
                  onNotesChange={(notes) =>
                    setNewEvent((prev) => ({
                      ...prev,
                      notes,
                    }))
                  }
                />
              )}

              {/* Entity editing / normal display */}
              {editingEntityId === entity.id ? (
                <div className="farmos-entity-edit">
                  <div className="farmos-form-grid">
                    <div className="farmos-form-field">
                      <label htmlFor={`edit-code-${entity.id}`}>
                        Entity code
                      </label>

                      <input
                        id={`edit-code-${entity.id}`}
                        value={editingEntity.entityCode}
                        onChange={(e) =>
                          setEditingEntity((prev) => ({
                            ...prev,
                            entityCode: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="farmos-form-field">
                      <label htmlFor={`edit-name-${entity.id}`}>
                        Entity name
                      </label>

                      <input
                        id={`edit-name-${entity.id}`}
                        value={editingEntity.entityName}
                        onChange={(e) =>
                          setEditingEntity((prev) => ({
                            ...prev,
                            entityName: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>

                    <div className="farmos-form-field">
                      <label htmlFor={`edit-location-${entity.id}`}>
                        Location
                      </label>

                      <input
                        id={`edit-location-${entity.id}`}
                        value={editingEntity.location}
                        onChange={(e) =>
                          setEditingEntity((prev) => ({
                            ...prev,
                            location: e.target.value,
                          }))
                        }
                        placeholder="e.g. Goat shed"
                      />
                    </div>

                    <div className="farmos-form-field farmos-form-field--full">
                      <label htmlFor={`edit-notes-${entity.id}`}>Notes</label>

                      <textarea
                        id={`edit-notes-${entity.id}`}
                        value={editingEntity.notes}
                        onChange={(e) =>
                          setEditingEntity((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                        rows="3"
                      />
                    </div>
                  </div>

                  <div className="farmos-entity-edit__actions">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEntityId(null);
                        setEditingEntity({
                          entityCode: "",
                          entityName: "",
                          location: "",
                          notes: "",
                        });
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() => saveEditedEntity(entity.id)}
                      disabled={savingEntity}
                    >
                      {savingEntity ? "Saving…" : "Save changes"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
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

                  <div className="farmos-entity-row__actions">
                    <button
                      type="button"
                      onClick={() => handleSelectEntity(entity.id)}
                    >
                      History
                    </button>

                    <button
                      type="button"
                      onClick={() => startEditingEntity(entity)}
                    >
                      Edit
                    </button>

                    <select
                      value={entity.status ?? "active"}
                      onChange={(e) =>
                        handleStatusChange(entity.id, e.target.value)
                      }
                      disabled={updatingStatusId === entity.id}
                      aria-label={`Status for ${
                        entity.entity_name ?? entity.label
                      }`}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
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

              <input
                id="entity-variant"
                name="entity-variant"
                list="entity-variant-options"
                value={variantSearch}
                disabled={!newEntity.speciesConfigId}
                placeholder={
                  newEntity.speciesConfigId
                    ? "Select or type a breed / variety / type"
                    : "Select a species / crop first"
                }
                onChange={(event) =>
                  handleVariantSearchChange(event.target.value)
                }
              />

              <datalist id="entity-variant-options">
                {getVariantsForSpecies(newEntity.speciesConfigId).map(
                  (variant) => (
                    <option key={variant.id} value={variant.name} />
                  ),
                )}
              </datalist>

              {newEntity.speciesConfigId &&
                variantSearch.trim() &&
                !newEntity.variantId && (
                  <button
                    type="button"
                    className="farmos-inline-create"
                    onClick={() => {
                      setNewVariant((prev) => ({
                        ...prev,
                        speciesConfigId: newEntity.speciesConfigId,
                        name: variantSearch.trim(),
                      }));

                      setShowNewVariantConfig(true);
                    }}
                  >
                    + Create "{variantSearch.trim()}" as a new variant
                  </button>
                )}
            </div>
            {showNewVariantConfig &&
              newEntity.speciesConfigId &&
              !newEntity.variantId && (
                <div className="farmos-new-variant-config">
                  <div className="farmos-new-variant-config__header">
                    <div>
                      <h4>Create new variant</h4>
                      <p>
                        Add a breed, variety, strain, cultivar, or type for the
                        selected species / crop.
                      </p>
                    </div>
                  </div>

                  <div className="farmos-form-grid">
                    <div className="farmos-form-field">
                      <label htmlFor="inline-variant-type">Variant type</label>

                      <select
                        id="inline-variant-type"
                        value={newVariant.variantType}
                        onChange={(event) =>
                          setNewVariant((prev) => ({
                            ...prev,
                            variantType: event.target.value,
                          }))
                        }
                      >
                        {VARIANT_TYPE_OPTIONS.map((type) => (
                          <option key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="farmos-form-field">
                      <label htmlFor="inline-variant-name">Variant name</label>

                      <input
                        id="inline-variant-name"
                        value={newVariant.name}
                        onChange={(event) =>
                          setNewVariant((prev) => ({
                            ...prev,
                            name: event.target.value,
                          }))
                        }
                        placeholder="e.g. Jamunapari"
                      />
                    </div>
                  </div>

                  <div className="farmos-new-variant-config__actions">
                    <button
                      type="button"
                      className="farmos-button farmos-button--secondary"
                      onClick={() => {
                        setShowNewVariantConfig(false);
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="farmos-button farmos-button--primary"
                      onClick={handleCreateVariantForEntity}
                      disabled={savingVariant}
                    >
                      {savingVariant
                        ? "Creating..."
                        : "Create variant & continue"}
                    </button>
                  </div>
                </div>
              )}

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