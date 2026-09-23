import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  Activity,
  CircleDot,
  ClipboardList,
  Leaf,
  Pencil,
  Plus,
  Sprout,
  Users,
} from "lucide-react";
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
gsap.registerPlugin(Flip);

const CATEGORY_OPTIONS = ["poultry", "livestock", "crop", "fodder"];
const LIVESTOCK_STATUS_OPTIONS = ["active", "sold", "deceased"];
const CROP_STATUS_OPTIONS = ["active", "harvested"];

function emptyCapabilitySet() {
  return CAPABILITY_OPTIONS.reduce(
    (acc, c) => ({ ...acc, [c.key]: false }),
    {},
  );
}

function getStatusOptions(entity) {
  const category = entity.species_config?.category;

  if (category === "crop" || category === "fodder") {
    return CROP_STATUS_OPTIONS;
  }

  return LIVESTOCK_STATUS_OPTIONS;
}
function AnimatedNumber({ value }) {
  const [displayValue, setDisplayValue] = useState(Number(value) || 0);
  const previousValueRef = useRef(Number(value) || 0);

  useEffect(() => {
    const nextValue = Number(value) || 0;
    const startValue = previousValueRef.current;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (startValue === nextValue) {
      return undefined;
    }

    if (reduceMotion) {
      previousValueRef.current = nextValue;
      return undefined;
    }

    const duration = 450;
    const startTime = performance.now();

    let frameId;

    const animate = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);

      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const currentValue =
        startValue + (nextValue - startValue) * easedProgress;

      setDisplayValue(currentValue);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        previousValueRef.current = nextValue;
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [value]);

  return (
    <>
      {Math.round(
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? Number(value) || 0
          : displayValue,
      ).toLocaleString()}
    </>
  );
}

function Species() {
  const [speciesList, setSpeciesList] = useState([]);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pageError, setPageError] = useState("");
  const [speciesVisible, setSpeciesVisible] = useState(false);
  const speciesSectionRef = useRef(null);

  const [newSpecies, setNewSpecies] = useState({
    name: "",
    category: "poultry",
    capabilities: emptyCapabilitySet(),
    spaceUnit: "",
    feedUnit: "",
  });
  const [savingSpecies, setSavingSpecies] = useState(false);
  const [newSpeciesId, setNewSpeciesId] = useState(null);

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
  const [newEntityId, setNewEntityId] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [updatedEntityId, setUpdatedEntityId] = useState(null);
  const [entityFilter, setEntityFilter] = useState("all");
  const [entitySearch, setEntitySearch] = useState("");

  const [rotationRules, setRotationRules] = useState([]);
  const [newRule, setNewRule] = useState({
    fromSpeciesId: "",
    toSpeciesId: "",
    reason: "",
  });
  const [savingRule, setSavingRule] = useState(false);
  const [newRuleId, setNewRuleId] = useState(null);
  const [rotationRulesVisible, setRotationRulesVisible] = useState(false);
  const rotationRulesSectionRef = useRef(null);
  const entityListRef = useRef(null);

  async function loadAll() {
    setLoading(true);
    setLoadError("");

    const [speciesRes, entitiesRes, rulesRes] = await Promise.all([
      supabase.from("species_config").select("*").order("name"),
      supabase
        .from("farm_entities")
        .select(
          "id, label, quantity, status, species_config:species_config_id(id, name, category)",
        )
        .order("label"),
      supabase
        .from("crop_rotation_rules")
        .select(
          "*, from_species:from_species_id(name), to_species:to_species_id(name)",
        )
        .order("created_at"),
    ]);

    if (speciesRes.error) {
      setLoadError(speciesRes.error.message);
      setLoading(false);
      return;
    }

    if (entitiesRes.error) {
      setLoadError(entitiesRes.error.message);
      setLoading(false);
      return;
    }

    if (rulesRes.error) {
      setLoadError(rulesRes.error.message);
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

  useEffect(() => {
    const element = speciesSectionRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSpeciesVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = rotationRulesSectionRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRotationRulesVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(element);

    return () => observer.disconnect();
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

    const { data: createdSpecies, error } = await supabase
      .from("species_config")
      .insert({
        name: newSpecies.name.trim(),
        category: newSpecies.category,
        capabilities: capabilitiesToPayload(newSpecies.capabilities),
        space_unit: newSpecies.spaceUnit || null,
        feed_unit: newSpecies.feedUnit || null,
      })
      .select("id")
      .single();

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

    setNewSpeciesId(createdSpecies.id);
    loadAll();

    setTimeout(() => setNewSpeciesId(null), 700);
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

    const { data: createdEntity, error } = await supabase
      .from("farm_entities")
      .insert({
        species_config_id: newEntity.speciesConfigId,
        label: newEntity.label.trim(),
        quantity: newEntity.quantity !== "" ? Number(newEntity.quantity) : null,
        acquired_at: newEntity.acquiredAt || null,
        location: newEntity.location || null,
        notes: newEntity.notes || null,
        status: "active",
      })
      .select("id")
      .single();

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

    setNewEntityId(createdEntity.id);
    loadAll();

    setTimeout(() => setNewEntityId(null), 700);
  }

  async function handleStatusChange(entityId, status) {
    const entity = entities.find((item) => item.id === entityId);

    if (!entity || entity.status !== "active") {
      return;
    }

    const allowedStatuses = getStatusOptions(entity);

    if (!allowedStatuses.includes(status)) {
      return;
    }

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

      setUpdatedEntityId(entityId);
      setTimeout(() => setUpdatedEntityId(null), 700);
    }
  }

  async function handleAddRule(e) {
    e.preventDefault();
    if (
      !newRule.fromSpeciesId ||
      !newRule.toSpeciesId ||
      !newRule.reason.trim()
    )
      return;
    setSavingRule(true);
    setPageError("");

    const { data: createdRule, error } = await supabase
      .from("crop_rotation_rules")
      .insert({
        from_species_id: newRule.fromSpeciesId,
        to_species_id: newRule.toSpeciesId,
        reason: newRule.reason.trim(),
      })
      .select("id")
      .single();

    setSavingRule(false);
    if (error) {
      setPageError(error.message);
      return;
    }
    setNewRule({ fromSpeciesId: "", toSpeciesId: "", reason: "" });

    setNewRuleId(createdRule.id);
    loadAll();

    setTimeout(() => setNewRuleId(null), 700);
  }

  useEffect(() => {
    const element = entityListRef.current;
    if (!element) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const state = Flip.getState(element.children);

    requestAnimationFrame(() => {
      Flip.from(state, {
        duration: 0.4,
        ease: "power2.out",
        absolute: false,
        fade: true,
      });
    });
  }, [entityFilter, entitySearch]);
  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Loading species and farm data…
        </p>
      </div>
    );
  }
  const activeEntities = entities.filter(
    (entity) => entity.status === "active",
  );
  const totalQuantity = activeEntities.reduce(
    (sum, entity) => sum + (Number(entity.quantity) || 0),
    0,
  );
  const filteredEntities = entities.filter((entity) => {
    const matchesStatus =
      entityFilter === "all" || entity.status === entityFilter;
    const query = entitySearch.trim().toLowerCase();
    const matchesSearch =
      !query ||
      entity.label?.toLowerCase().includes(query) ||
      entity.species_config?.name?.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });


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
        <Card className="border-destructive/30 bg-destructive/[0.03]">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-destructive">{pageError}</p>
          </CardContent>
        </Card>
      )}

      <section>
        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Species & crops",
                  value: speciesList.length,
                  icon: Leaf,
                },
                {
                  label: "Registered entities",
                  value: entities.length,
                  icon: Users,
                },
                {
                  label: "Active entities",
                  value: activeEntities.length,
                  icon: Activity,
                },
                {
                  label: "Tracked quantity",
                  value: totalQuantity.toLocaleString(),
                  icon: ClipboardList,
                },
              ].map(({ label, value, icon: Icon }, index) => (
                <Card
                  key={label}
                  className="species-summary-card border-border/70 shadow-none"
                  style={{ "--delay": `${index * 80}ms` }}
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        {label}
                      </p>
                      <p className="mt-1 text-xl font-semibold tracking-tight">
                        <AnimatedNumber value={value} />
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* --- Species / crop configuration --- */}
      <section ref={speciesSectionRef} className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Species & Crops
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Reusable definitions that control how Farm OS tracks each type.
            </p>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {speciesList.length} configured
          </span>
        </div>
        <div className="grid gap-3 mb-4">
          {speciesList.map((species, index) => (
            <Card
              key={species.id}
              className={`species-config-card ${
                speciesVisible ? "species-config-card-visible" : ""
              } ${
                newSpeciesId === species.id ? "species-config-card-updated" : ""
              } border-border/70 bg-card shadow-sm`}
              style={{ "--delay": `${index * 80}ms` }}
            >
              <CardHeader className="border-b border-border/50 bg-muted/[0.18] px-5 py-4 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Leaf className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">
                        {species.name}
                      </CardTitle>

                      <CardDescription className="mt-1 capitalize">
                        {species.category}
                      </CardDescription>
                    </div>
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
                <CardContent className="species-edit-panel pt-1">
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
                      Object.keys(species.capabilities).map((key, index) => (
                        <Badge
                          key={key}
                          variant="outline"
                          className="species-capability-badge font-normal"
                          style={{ "--delay": `${index * 60}ms` }}
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

              <Button
                type="submit"
                disabled={savingSpecies}
                className="w-auto gap-2"
              >
                <Plus className="size-4" />
                {savingSpecies ? "Adding…" : "Add species"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* --- Farm entities --- */}
      <section className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Farm entities
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Register the actual animals, groups, plots, and operating units on
              your farm.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <CircleDot className="size-3.5 text-primary" />
            {activeEntities.length} active
          </div>
        </div>

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-base">Registered entities</CardTitle>
              <CardDescription>
                Search and filter what is currently registered.
              </CardDescription>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Input
                value={entitySearch}
                onChange={(e) => setEntitySearch(e.target.value)}
                placeholder="Search entities…"
                className="sm:w-52"
              />
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All statuses</option>
                {[
                  ...new Set([
                    ...LIVESTOCK_STATUS_OPTIONS,
                    ...CROP_STATUS_OPTIONS,
                  ]),
                ].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>

          <CardContent>
            {entities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No farm entities registered yet.
              </p>
            ) : filteredEntities.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <p className="text-sm font-medium">No matching entities</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try another search or status filter.
                </p>
              </div>
            ) : (
              <div ref={entityListRef} className="grid gap-2">
                {filteredEntities.map((entity) => (
                  <div
                    key={entity.id}
                    className={`species-entity-row ${
                      updatedEntityId === entity.id
                        ? "species-entity-row-updated"
                        : ""
                    } ${
                      newEntityId === entity.id ? "species-entity-row-new" : ""
                    } flex flex-col gap-3 rounded-xl border border-border/70 bg-background/70 p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between`}
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

                    {entity.status === "active" ? (
                      <select
                        ref={(element) => {
                          if (
                            element &&
                            updatedEntityId === entity.id &&
                            !window.matchMedia(
                              "(prefers-reduced-motion: reduce)",
                            ).matches
                          ) {
                            gsap.fromTo(
                              element,
                              { scale: 0.96 },
                              {
                                scale: 1,
                                duration: 0.4,
                                ease: "back.out(2)",
                              },
                            );
                          }
                        }}
                        value={entity.status}
                        onChange={(e) =>
                          handleStatusChange(entity.id, e.target.value)
                        }
                        disabled={updatingStatusId === entity.id}
                        className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm capitalize shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-36"
                      >
                        {getStatusOptions(entity).map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Badge
                        variant={
                          entity.status === "deceased"
                            ? "destructive"
                            : entity.status === "harvested"
                              ? "outline"
                              : "secondary"
                        }
                        className="w-full justify-center capitalize sm:w-36"
                      >
                        {entity.status}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="border-b border-border/50 bg-muted/[0.18] px-5 py-4 sm:px-6">
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

                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="entity-notes" className="text-sm font-medium">
                    Notes
                  </label>

                  <Input
                    id="entity-notes"
                    type="text"
                    placeholder="Optional notes about this entity"
                    value={newEntity.notes}
                    onChange={(e) =>
                      setNewEntity((p) => ({
                        ...p,
                        notes: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={savingEntity}
                className="w-auto gap-2"
              >
                <Plus className="size-4" />
                {savingEntity ? "Registering…" : "Register entity"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* --- Crop rotation rules --- */}
      <section
        ref={rotationRulesSectionRef}
        className={`species-rotation-section ${
          rotationRulesVisible ? "species-rotation-section-visible" : ""
        } space-y-4`}
      >
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
          <CardHeader className="border-b border-border/50 bg-muted/[0.18] px-5 py-4 sm:px-6">
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
                {rotationRules.map((rule, index) => (
                  <div
                    key={rule.id}
                    className={`species-rotation-rule-card ${
                      rotationRulesVisible
                        ? "species-rotation-rule-card-visible"
                        : ""
                    } ${
                      newRuleId === rule.id ? "species-rotation-rule-new" : ""
                    } rounded-xl border border-border/70 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
                    style={{ "--delay": `${index * 80}ms` }}
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
          <CardHeader className="border-b border-border/50 bg-muted/[0.18] px-5 py-4 sm:px-6">
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

              <Button
                type="submit"
                disabled={savingRule}
                className="w-auto gap-2"
              >
                <Plus className="size-4" />
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
