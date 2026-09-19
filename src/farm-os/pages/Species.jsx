import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { Pencil, Sprout } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const [rotationRules, setRotationRules] = useState([]);
  const [newRule, setNewRule] = useState({ fromSpeciesId: "", toSpeciesId: "", reason: "" });
  const [savingRule, setSavingRule] = useState(false);

  async function loadAll() {
    setLoading(true);
    setLoadError("");

    const [speciesRes, entitiesRes, rulesRes] = await Promise.all([
      supabase.from("species_config").select("*").order("name"),
      supabase
        .from("farm_entities")
        .select("id, label, quantity, status, species_config:species_config_id(id, name)")
        .order("label"),
      supabase
        .from("crop_rotation_rules")
        .select("*, from_species:from_species_id(name), to_species:to_species_id(name)")
        .order("created_at"),
    ]);

    if (speciesRes.error) {
      setLoadError(speciesRes.error.message);
      setLoading(false);
      return;
    }

    setRotationRules(rulesRes.data ?? []);

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
    setPageError("");

    const { data, error } = await supabase.rpc("change_entity_status", {
      p_entity_id: entityId,
      p_status: status,
      p_reason: null,
    });

    setUpdatingStatusId(null);

    if (error) {
      setPageError(error.message);
      return;
    }

    if (data?.changed) {
      setEntities((currentEntities) =>
        currentEntities.map((entity) =>
          entity.id === entityId ? { ...entity, status: data.status } : entity,
        ),
      );
    }
  }

  async function handleAddRule(e) {
    e.preventDefault();
    if (!newRule.fromSpeciesId || !newRule.toSpeciesId || !newRule.reason.trim()) return;
    setSavingRule(true);
    setPageError("");

    const { error } = await supabase.from("crop_rotation_rules").insert({
      from_species_id: newRule.fromSpeciesId,
      to_species_id: newRule.toSpeciesId,
      reason: newRule.reason.trim(),
    });

    setSavingRule(false);
    if (error) {
      setPageError(error.message);
      return;
    }
    setNewRule({ fromSpeciesId: "", toSpeciesId: "", reason: "" });
    loadAll();
  }

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Loading species and farm data…
        </p>
      </div>
    );
  }
  if (loadError) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="p-6">
          <p className="text-sm font-medium text-destructive">
            Unable to load farm configuration
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{loadError}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-7">
      {/* Page Header */}
      <div className="flex flex-col gap-5 border-b border-border/60 pb-7">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            <Sprout className="size-4 text-primary" />
            <span>Farm configuration</span>
          </div>

          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.03em] text-foreground sm:text-5xl">
              Species & Entities
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Configure what your farm manages, then register the animals,
              groups, plots, and other entities you actually operate.
            </p>
          </div>
        </div>
      </div>

      {pageError && (
        <Card className="border-destructive/30">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-destructive">{pageError}</p>
          </CardContent>
        </Card>
      )}

      {/* --- Species / crop configuration --- */}
      <section className="space-y-4">
        <div>
          <h2 className="mb-3.5 text-xl font-semibold tracking-tight">
            Species & Crops
          </h2>
        </div>
        <div className="grid gap-3 mb-4">
          {speciesList.map((species) => (
            <Card
              key={species.id}
              className="border-border/70 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">
                      {species.name}
                    </CardTitle>

                    <CardDescription className="mt-1">
                      {species.category}
                    </CardDescription>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {species.category}
                    </Badge>

                    {editingSpeciesId !== species.id && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 px-2.5"
                        onClick={() => startEditing(species)}
                      >
                        <Pencil className="size-3.5" />
                        <span>Edit</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {editingSpeciesId === species.id ? (
                <CardContent className="pt-1">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium">Capabilities</p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Select the capabilities this species or crop should
                        support.
                      </p>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {CAPABILITY_OPTIONS.map((cap) => (
                        <label
                          key={cap.key}
                          className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/70 px-3 py-2.5 text-sm transition-colors hover:bg-muted/50"
                        >
                          <input
                            type="checkbox"
                            checked={!!editingCapabilities[cap.key]}
                            onChange={() =>
                              setEditingCapabilities((prev) => ({
                                ...prev,
                                [cap.key]: !prev[cap.key],
                              }))
                            }
                            className="size-4 accent-primary"
                          />

                          <span>{cap.label}</span>
                        </label>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => saveEditedCapabilities(species)}
                        disabled={savingEdit}
                      >
                        {savingEdit ? "Saving…" : "Save changes"}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingSpeciesId(null)}
                        disabled={savingEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              ) : (
                <CardContent className="pt-1 pb-4">
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(species.capabilities ?? {}).length === 0 ? (
                      <span className="text-sm text-muted-foreground">
                        No capabilities set
                      </span>
                    ) : (
                      Object.keys(species.capabilities).map((key) => (
                        <Badge
                          key={key}
                          variant="outline"
                          className="font-normal"
                        >
                          {CAPABILITY_OPTIONS.find((c) => c.key === key)
                            ?.label ?? key}
                        </Badge>
                      ))
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">
              Add a new species or crop
            </CardTitle>
            <CardDescription>
              Create a reusable configuration for a new animal, crop, or fodder
              type.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleAddSpecies} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="species-name" className="text-sm font-medium">
                    Name
                  </label>

                  <Input
                    id="species-name"
                    type="text"
                    placeholder="e.g. Duck"
                    value={newSpecies.name}
                    onChange={(e) =>
                      setNewSpecies((p) => ({
                        ...p,
                        name: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="species-category"
                    className="text-sm font-medium"
                  >
                    Category
                  </label>

                  <select
                    id="species-category"
                    value={newSpecies.category}
                    onChange={(e) =>
                      setNewSpecies((p) => ({
                        ...p,
                        category: e.target.value,
                      }))
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {CATEGORY_OPTIONS.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="species-space-unit"
                    className="text-sm font-medium"
                  >
                    Space unit
                  </label>

                  <Input
                    id="species-space-unit"
                    type="text"
                    placeholder="e.g. sq ft"
                    value={newSpecies.spaceUnit}
                    onChange={(e) =>
                      setNewSpecies((p) => ({
                        ...p,
                        spaceUnit: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="species-feed-unit"
                    className="text-sm font-medium"
                  >
                    Feed unit
                  </label>

                  <Input
                    id="species-feed-unit"
                    type="text"
                    placeholder="e.g. kg/day"
                    value={newSpecies.feedUnit}
                    onChange={(e) =>
                      setNewSpecies((p) => ({
                        ...p,
                        feedUnit: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Capabilities</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Choose which farm operations this species or crop supports.
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {CAPABILITY_OPTIONS.map((cap) => (
                    <label
                      key={cap.key}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/70 px-3 py-2.5 text-sm transition-colors hover:bg-muted/50"
                    >
                      <input
                        type="checkbox"
                        checked={newSpecies.capabilities[cap.key]}
                        onChange={() => toggleNewCapability(cap.key)}
                        className="size-4 accent-primary"
                      />

                      <span>{cap.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button type="submit" disabled={savingSpecies} className="w-auto">
                {savingSpecies ? "Adding…" : "Add species"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* --- Farm entities --- */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Farm entities
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Register and manage the actual animals, groups, plots, and other
            operating units on your farm.
          </p>
        </div>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Registered entities</CardTitle>
            <CardDescription>
              Select an entity to view its detailed history and activity.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {entities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No farm entities registered yet.
              </p>
            ) : (
              <div className="grid gap-3">
                {entities.map((entity) => (
                  <div
                    key={entity.id}
                    className="flex flex-col gap-3 rounded-xl border border-border/70 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <Link
                        to={`/farm-os/entities/${entity.id}`}
                        className="font-medium text-foreground transition-colors hover:text-primary"
                      >
                        {entity.label}
                      </Link>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>{entity.species_config?.name}</span>

                        {entity.quantity != null && (
                          <>
                            <span>·</span>
                            <span>{entity.quantity}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <select
                      value={entity.status}
                      onChange={(e) =>
                        handleStatusChange(entity.id, e.target.value)
                      }
                      disabled={updatingStatusId === entity.id}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm capitalize shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-36"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">
              Register a new farm entity
            </CardTitle>
            <CardDescription>
              Add an actual animal, group, crop plot, or other entity to the
              farm.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleAddEntity} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="entity-species"
                    className="text-sm font-medium"
                  >
                    Species or crop
                  </label>

                  <select
                    id="entity-species"
                    value={newEntity.speciesConfigId}
                    onChange={(e) =>
                      setNewEntity((p) => ({
                        ...p,
                        speciesConfigId: e.target.value,
                      }))
                    }
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Select species/crop…</option>

                    {speciesList.map((species) => (
                      <option key={species.id} value={species.id}>
                        {species.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="entity-label" className="text-sm font-medium">
                    Entity label
                  </label>

                  <Input
                    id="entity-label"
                    type="text"
                    placeholder="e.g. Duck flock — batch 1"
                    value={newEntity.label}
                    onChange={(e) =>
                      setNewEntity((p) => ({
                        ...p,
                        label: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="entity-quantity"
                    className="text-sm font-medium"
                  >
                    Quantity
                  </label>

                  <Input
                    id="entity-quantity"
                    type="number"
                    step="any"
                    placeholder="e.g. 100"
                    value={newEntity.quantity}
                    onChange={(e) =>
                      setNewEntity((p) => ({
                        ...p,
                        quantity: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="entity-acquired"
                    className="text-sm font-medium"
                  >
                    Acquired date
                  </label>

                  <Input
                    id="entity-acquired"
                    type="date"
                    value={newEntity.acquiredAt}
                    onChange={(e) =>
                      setNewEntity((p) => ({
                        ...p,
                        acquiredAt: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label
                    htmlFor="entity-location"
                    className="text-sm font-medium"
                  >
                    Location
                  </label>

                  <Input
                    id="entity-location"
                    type="text"
                    placeholder="e.g. Quail shed"
                    value={newEntity.location}
                    onChange={(e) =>
                      setNewEntity((p) => ({
                        ...p,
                        location: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <Button type="submit" disabled={savingEntity} className="w-auto">
                {savingEntity ? "Registering…" : "Register entity"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* --- Crop rotation rules --- */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Crop rotation rules
          </h2>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Define which crop can reasonably follow another and why. These rules
            can later be used as suggestions after a crop is harvested.
          </p>
        </div>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Existing rules</CardTitle>
            <CardDescription>
              Crop sequence recommendations configured for the farm.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {rotationRules.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No rotation rules yet.
              </p>
            ) : (
              <div className="grid gap-3">
                {rotationRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="rounded-xl border border-border/70 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <p className="text-sm font-medium">
                      {rule.from_species?.name} → {rule.to_species?.name}
                    </p>

                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {rule.reason}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Add a rotation rule</CardTitle>

            <CardDescription>
              Explain what should follow a crop and why.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleAddRule} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="rotation-from"
                    className="text-sm font-medium"
                  >
                    After this crop
                  </label>

                  <select
                    id="rotation-from"
                    value={newRule.fromSpeciesId}
                    onChange={(e) =>
                      setNewRule((p) => ({
                        ...p,
                        fromSpeciesId: e.target.value,
                      }))
                    }
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Select crop…</option>

                    {speciesList
                      .filter(
                        (species) =>
                          species.category === "crop" ||
                          species.category === "fodder",
                      )
                      .map((species) => (
                        <option key={species.id} value={species.id}>
                          {species.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="rotation-to" className="text-sm font-medium">
                    Suggest this crop
                  </label>

                  <select
                    id="rotation-to"
                    value={newRule.toSpeciesId}
                    onChange={(e) =>
                      setNewRule((p) => ({
                        ...p,
                        toSpeciesId: e.target.value,
                      }))
                    }
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Select crop…</option>

                    {speciesList
                      .filter(
                        (species) =>
                          species.category === "crop" ||
                          species.category === "fodder",
                      )
                      .map((species) => (
                        <option key={species.id} value={species.id}>
                          {species.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="rotation-reason"
                  className="text-sm font-medium"
                >
                  Reason
                </label>

                <Input
                  id="rotation-reason"
                  type="text"
                  placeholder="e.g. Legume replenishes nitrogen after a heavy feeder"
                  value={newRule.reason}
                  onChange={(e) =>
                    setNewRule((p) => ({
                      ...p,
                      reason: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <Button type="submit" disabled={savingRule} className="w-auto">
                {savingRule ? "Adding…" : "Add rule"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export default Species;
