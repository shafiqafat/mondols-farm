import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  Activity,
  ClipboardList,
  Leaf,
  Plus,
  Sprout,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import ConfirmDialog from "../components/ConfirmDialog";
import ArchiveDialog from "../components/ArchiveDialog";
import { Button } from "@/components/ui/button";
import SpeciesConfigCard from "../components/species/SpeciesConfigCard";
import FarmEntityList from "../components/species/FarmEntityList";
import RotationRules from "../components/species/RotationRules";
const CAPABILITY_OPTIONS = [
  { key: "feed", label: "Feed" },
  { key: "health", label: "Health" },
  { key: "weight", label: "Weight" },
  { key: "egg", label: "Egg production" },
  { key: "breeding", label: "Breeding" },
  { key: "milk", label: "Milk" },
  { key: "harvest", label: "Harvest" },
];

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
  const [rotationRules, setRotationRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pageError, setPageError] = useState("");
  const [speciesVisible, setSpeciesVisible] = useState(false);
  const speciesSectionRef = useRef(null);

  const [speciesActionId, setSpeciesActionId] = useState(null);
  const [speciesFilter, setSpeciesFilter] = useState("active");

  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [updatedEntityId, setUpdatedEntityId] = useState(null);
  const [entityActionId, setEntityActionId] = useState(null);

  const [speciesDeleteTarget, setSpeciesDeleteTarget] = useState(null);
  const [speciesArchiveTarget, setSpeciesArchiveTarget] = useState(null);
  const [entityArchiveTarget, setEntityArchiveTarget] = useState(null);
  const [entityDeleteTarget, setEntityDeleteTarget] = useState(null);

  async function loadAll() {
    setLoading(true);
    setLoadError("");

    const [speciesRes, entitiesRes, rulesRes] = await Promise.all([
      supabase.from("species_config").select("*").order("name"),
      supabase
        .from("farm_entities")
        .select(
          "id, label, quantity, status, archived_at, species_config:species_config_id(id, name, category)",
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



  async function saveSpeciesCapabilities(species, selectedCapabilities) {
    setPageError("");

    const existing = species.capabilities ?? {};
    const nextCapabilities = {};

    for (const key of Object.keys(selectedCapabilities)) {
      if (selectedCapabilities[key]) {
        nextCapabilities[key] = existing[key] ?? {};
      }
    }

    const { error } = await supabase
      .from("species_config")
      .update({ capabilities: nextCapabilities })
      .eq("id", species.id);

    if (error) {
      setPageError(error.message);
      return false;
    }

    setSpeciesList((current) =>
      current.map((item) =>
        item.id === species.id
          ? { ...item, capabilities: nextCapabilities }
          : item,
      ),
    );

    return true;
  }

  function handleDeleteSpecies(species) {
    setSpeciesDeleteTarget(species);
  }

  async function confirmDeleteSpecies() {
    if (!speciesDeleteTarget) {
      return;
    }

    const species = speciesDeleteTarget;

    setSpeciesActionId(species.id);
    setPageError("");

    const { data, error } = await supabase.rpc("delete_species_config", {
      p_species_id: species.id,
    });

    setSpeciesActionId(null);

    if (error) {
      setPageError(error.message);
      setSpeciesDeleteTarget(null);
      return;
    }

    if (!data?.deleted) {
      const dependencyMessages = [];

      if (data.entity_count > 0) {
        dependencyMessages.push(
          `${data.entity_count} registered farm ${
            data.entity_count === 1 ? "entity" : "entities"
          }`,
        );
      }

      if (data.variant_count > 0) {
        dependencyMessages.push(
          `${data.variant_count} ${
            data.variant_count === 1 ? "species variant" : "species variants"
          }`,
        );
      }

      if (data.rotation_rule_count > 0) {
        dependencyMessages.push(
          `${data.rotation_rule_count} crop rotation ${
            data.rotation_rule_count === 1 ? "rule" : "rules"
          }`,
        );
      }

      setPageError(
        `Cannot delete "${species.name}" because it is currently used by ${dependencyMessages.join(
          ", ",
        )}.`,
      );

      setSpeciesDeleteTarget(null);
      return;
    }

    setSpeciesList((currentSpecies) =>
      currentSpecies.filter((item) => item.id !== species.id),
    );

    setSpeciesDeleteTarget(null);
  }

  function handleArchiveSpecies(species) {
    setSpeciesArchiveTarget(species);
  }

  async function confirmArchiveSpecies() {
    if (!speciesArchiveTarget) {
      return;
    }

    const species = speciesArchiveTarget;

    setSpeciesActionId(species.id);
    setPageError("");

    const { error } = await supabase.rpc("archive_species_config", {
      p_species_id: species.id,
    });

    setSpeciesActionId(null);

    if (error) {
      setPageError(error.message);
      setSpeciesArchiveTarget(null);
      return;
    }

    setSpeciesList((current) =>
      current.map((item) =>
        item.id === species.id
          ? {
              ...item,
              archived_at: new Date().toISOString(),
            }
          : item,
      ),
    );

    setSpeciesArchiveTarget(null);
  }

  async function handleRestoreSpecies(species) {
    setSpeciesActionId(species.id);
    setPageError("");

    const { error } = await supabase.rpc("restore_species_config", {
      p_species_id: species.id,
    });

    setSpeciesActionId(null);

    if (error) {
      setPageError(error.message);
      return;
    }

    setSpeciesList((current) =>
      current.map((item) =>
        item.id === species.id ? { ...item, archived_at: null } : item,
      ),
    );
  }

  async function handleStatusChange(entityId, status) {
    const entity = entities.find((item) => item.id === entityId);

    if (!entity || entity.status !== "active") {
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
  function handleArchiveEntity(entityId) {
    const entity = entities.find((item) => item.id === entityId);

    if (!entity || entity.archived_at) {
      return;
    }

    setEntityArchiveTarget(entity);
  }

  async function confirmArchiveEntity() {
    if (!entityArchiveTarget) {
      return;
    }

    const entity = entityArchiveTarget;

    setEntityActionId(entity.id);
    setPageError("");

    const { data, error } = await supabase.rpc("archive_farm_entity", {
      p_entity_id: entity.id,
    });

    setEntityActionId(null);

    if (error) {
      setPageError(error.message);
      setEntityArchiveTarget(null);
      return;
    }

    if (data?.changed) {
      setEntities((currentEntities) =>
        currentEntities.map((item) =>
          item.id === entity.id
            ? {
                ...item,
                archived_at: new Date().toISOString(),
              }
            : item,
        ),
      );
    }

    setEntityArchiveTarget(null);
  }

  async function handleRestoreEntity(entityId) {
    const entity = entities.find((item) => item.id === entityId);

    if (!entity || !entity.archived_at) {
      return;
    }

    setEntityActionId(entityId);
    setPageError("");

    const { data, error } = await supabase.rpc("restore_farm_entity", {
      p_entity_id: entityId,
    });

    setEntityActionId(null);

    if (error) {
      setPageError(error.message);
      return;
    }

    if (data?.changed) {
      setEntities((currentEntities) =>
        currentEntities.map((item) =>
          item.id === entityId ? { ...item, archived_at: null } : item,
        ),
      );
    }
  }

  function handleDeleteEntity(entityId) {
    const entity = entities.find((item) => item.id === entityId);

    if (!entity || !entity.archived_at) {
      return;
    }

    setEntityDeleteTarget(entity);
  }

  async function confirmDeleteEntity() {
    if (!entityDeleteTarget) {
      return;
    }

    const entity = entityDeleteTarget;

    setEntityActionId(entity.id);
    setPageError("");

    const { data, error } = await supabase.rpc("delete_farm_entity", {
      p_entity_id: entity.id,
    });

    setEntityActionId(null);

    if (error) {
      setPageError(error.message);
      setEntityDeleteTarget(null);
      return;
    }

    if (!data?.deleted) {
      setPageError("The entity could not be deleted.");
      setEntityDeleteTarget(null);
      return;
    }

    setEntities((currentEntities) =>
      currentEntities.filter((item) => item.id !== entity.id),
    );

    setEntityDeleteTarget(null);
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
  const activeEntities = entities.filter(
    (entity) => entity.status === "active" && !entity.archived_at,
  );

  const totalQuantity = activeEntities.reduce(
    (sum, entity) => sum + (Number(entity.quantity) || 0),
    0,
  );


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

  const visibleSpecies = speciesList.filter((species) => {
    const isArchived = Boolean(species.archived_at);

    if (speciesFilter === "active") {
      return !isArchived;
    }

    if (speciesFilter === "archived") {
      return isArchived;
    }

    return true;
  });

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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Species & Crops
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Reusable definitions that control how Farm OS tracks each type.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground">
              {speciesList.length} configured
            </span>

            <div className="flex items-center gap-1 rounded-[12px] border border-border/70 p-1">
              <button
                type="button"
                onClick={() => setSpeciesFilter("active")}
                className={`rounded-[9px] px-3 py-1.5 text-xs font-medium transition-colors ${
                  speciesFilter === "active"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Active
              </button>

              <button
                type="button"
                onClick={() => setSpeciesFilter("archived")}
                className={`rounded-[9px] px-3 py-1.5 text-xs font-medium transition-colors ${
                  speciesFilter === "archived"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Archived
              </button>
            </div>

            <Button
              asChild
              size="sm"
              className="inline-flex w-auto flex-row items-center justify-center gap-2 rounded-[12px] whitespace-nowrap px-4"
            >
              <Link
                to="/farm-os/species/new"
                className="inline-flex flex-row items-center gap-2 whitespace-nowrap"
              >
                <Plus className="size-4 shrink-0" />
                <span className="whitespace-nowrap">Add New Species/Crop</span>
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 mb-4">
          {visibleSpecies.map((species, index) => (
            <SpeciesConfigCard
              key={species.id}
              species={species}
              index={index}
              visible={speciesVisible}
              capabilityOptions={CAPABILITY_OPTIONS}
              actionLoading={speciesActionId === species.id}
              onSaveCapabilities={saveSpeciesCapabilities}
              onArchive={handleArchiveSpecies}
              onRestore={handleRestoreSpecies}
              onDelete={handleDeleteSpecies}
            />
          ))}
        </div>
      </section>

      {/* --- Farm entities --- */}
      <FarmEntityList
        entities={entities}
        updatingStatusId={updatingStatusId}
        actionId={entityActionId}
        updatedEntityId={updatedEntityId}
        onStatusChange={handleStatusChange}
        onArchive={handleArchiveEntity}
        onRestore={handleRestoreEntity}
        onDelete={handleDeleteEntity}
      />

      {/* --- Crop rotation rules --- */}
      <RotationRules rules={rotationRules} />
      <ConfirmDialog
        open={Boolean(speciesDeleteTarget)}
        onOpenChange={(open) => {
          if (!open && !speciesActionId) {
            setSpeciesDeleteTarget(null);
          }
        }}
        title={
          speciesDeleteTarget
            ? `Delete "${speciesDeleteTarget.name}"?`
            : "Delete species?"
        }
        description={
          speciesDeleteTarget
            ? "This permanently deletes the species/crop configuration. It will not delete any farm entities. Deletion is only allowed when nothing is using this configuration."
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        loading={Boolean(
          speciesDeleteTarget && speciesActionId === speciesDeleteTarget.id,
        )}
        onConfirm={confirmDeleteSpecies}
      />
      <ArchiveDialog
        open={Boolean(speciesArchiveTarget)}
        onOpenChange={(open) => {
          if (!open && !speciesActionId) {
            setSpeciesArchiveTarget(null);
          }
        }}
        title={
          speciesArchiveTarget
            ? `Archive "${speciesArchiveTarget.name}"?`
            : "Archive species?"
        }
        description={
          speciesArchiveTarget
            ? "This will archive the species/crop configuration. Existing farm entities and their history will remain unchanged, but the configuration will no longer be available for new registrations."
            : ""
        }
        confirmLabel="Archive"
        cancelLabel="Cancel"
        loading={Boolean(
          speciesArchiveTarget && speciesActionId === speciesArchiveTarget.id,
        )}
        onConfirm={confirmArchiveSpecies}
      />
      <ArchiveDialog
        open={Boolean(entityArchiveTarget)}
        onOpenChange={(open) => {
          if (!open && !entityActionId) {
            setEntityArchiveTarget(null);
          }
        }}
        title={
          entityArchiveTarget
            ? `Archive "${entityArchiveTarget.label}"?`
            : "Archive entity?"
        }
        description={
          entityArchiveTarget
            ? "The entity and its history will be preserved, but it will be removed from normal active views."
            : ""
        }
        confirmLabel="Archive"
        cancelLabel="Cancel"
        loading={Boolean(
          entityArchiveTarget && entityActionId === entityArchiveTarget.id,
        )}
        onConfirm={confirmArchiveEntity}
      />
      <ConfirmDialog
        open={Boolean(entityDeleteTarget)}
        onOpenChange={(open) => {
          if (!open && !entityActionId) {
            setEntityDeleteTarget(null);
          }
        }}
        title={
          entityDeleteTarget
            ? `Delete "${entityDeleteTarget.label}"?`
            : "Delete entity?"
        }
        description={
          entityDeleteTarget
            ? "This permanently deletes the entity and its entity-specific history, including events, tasks, finance records, sales, project assignments, and content records."
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        loading={Boolean(
          entityDeleteTarget && entityActionId === entityDeleteTarget.id,
        )}
        onConfirm={confirmDeleteEntity}
      />
    </div>
  );
}

export default Species;
