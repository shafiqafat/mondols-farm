import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Leaf, Plus } from "lucide-react";

import { supabase } from "../lib/supabaseClient";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function NewEntity() {
  const navigate = useNavigate();

  const [speciesList, setSpeciesList] = useState([]);
  const [loadingSpecies, setLoadingSpecies] = useState(true);
  const [speciesError, setSpeciesError] = useState("");

  const [speciesSearch, setSpeciesSearch] = useState("");

  const [newEntity, setNewEntity] = useState({
    speciesConfigId: "",
    label: "",
    quantity: "",
    acquiredAt: "",
    location: "",
    notes: "",
  });

  const [savingEntity, setSavingEntity] = useState(false);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    async function loadSpecies() {
      setLoadingSpecies(true);
      setSpeciesError("");

      const { data, error } = await supabase
        .from("species_config")
        .select("id, name, category")
        .order("name");

      if (error) {
        setSpeciesError(error.message);
        setLoadingSpecies(false);
        return;
      }

      setSpeciesList(data ?? []);
      setLoadingSpecies(false);
    }

    loadSpecies();
  }, []);

  function handleSpeciesChange(value) {
    setSpeciesSearch(value);

    const matchedSpecies = speciesList.find(
      (species) =>
        species.name.trim().toLowerCase() === value.trim().toLowerCase(),
    );

    setNewEntity((prev) => ({
      ...prev,
      speciesConfigId: matchedSpecies?.id ?? "",
    }));
  }

  async function handleAddEntity(e) {
    e.preventDefault();

    if (!newEntity.speciesConfigId || !newEntity.label.trim()) {
      return;
    }

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

    navigate(`/farm-os/entities/${createdEntity.id}`);
  }

  const hasExactSpeciesMatch = speciesList.some(
    (species) =>
      species.name.trim().toLowerCase() === speciesSearch.trim().toLowerCase(),
  );

  return (
    <div className="space-y-7">
      {/* Page Header */}
      <div className="flex flex-col gap-5 border-b border-border/60 pb-7">
        <div className="flex items-center gap-2">
          <div className="w-fit">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="!inline-flex !w-fit !flex-row !items-center !justify-start gap-2 whitespace-nowrap px-2"
            >
              <Link
                to="/farm-os/species"
                className="!inline-flex !w-fit !flex-row !items-center gap-2 whitespace-nowrap"
              >
                <ArrowLeft className="size-4 shrink-0" />
                <span className="whitespace-nowrap">
                  Back to Species & Entities
                </span>
              </Link>
            </Button>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            <Leaf className="size-4 text-primary" />
            <span>Farm configuration</span>
          </div>

          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.03em] text-foreground sm:text-5xl">
              Register farm entity
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Register an actual animal, group, crop plot, or other operating
              unit on your farm.
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

      {speciesError && (
        <Card className="border-destructive/30 bg-destructive/[0.03]">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-destructive">
              Unable to load species and crop configurations.
            </p>

            <p className="mt-1 text-sm text-muted-foreground">{speciesError}</p>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="border-b border-border/50 bg-muted/[0.18] px-5 py-4 sm:px-6">
          <CardTitle className="text-base">Entity registration</CardTitle>

          <CardDescription>
            Connect this farm entity to an existing species or crop
            configuration.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 sm:p-6">
          <form onSubmit={handleAddEntity} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Species / Crop */}
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="entity-species" className="text-sm font-medium">
                  Species or crop
                </label>

                <Input
                  id="entity-species"
                  type="text"
                  list="farm-os-species-options"
                  placeholder="Type or select a species/crop"
                  value={speciesSearch}
                  onChange={(e) => handleSpeciesChange(e.target.value)}
                  disabled={loadingSpecies}
                  required
                />

                <datalist id="farm-os-species-options">
                  {speciesList.map((species) => (
                    <option key={species.id} value={species.name} />
                  ))}
                </datalist>

                {speciesSearch.trim() && !hasExactSpeciesMatch && (
                  <div className="rounded-lg border border-dashed border-border p-3">
                    <p className="text-sm text-muted-foreground">
                      "{speciesSearch.trim()}" is not configured yet.
                    </p>

                    <Button
                      asChild
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2 gap-2"
                    >
                      <Link to="/farm-os/species/new">
                        <Plus className="size-4" />
                        Add species/crop
                      </Link>
                    </Button>
                  </div>
                )}

                {speciesSearch.trim() && hasExactSpeciesMatch && (
                  <p className="text-xs text-muted-foreground">
                    Species/crop configuration selected.
                  </p>
                )}
              </div>

              {/* Entity Label */}
              <div className="space-y-2">
                <label htmlFor="entity-label" className="text-sm font-medium">
                  Entity label
                </label>

                <Input
                  id="entity-label"
                  type="text"
                  placeholder="e.g. Quail flock — batch 1"
                  value={newEntity.label}
                  onChange={(e) =>
                    setNewEntity((prev) => ({
                      ...prev,
                      label: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              {/* Quantity */}
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
                    setNewEntity((prev) => ({
                      ...prev,
                      quantity: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Acquired Date */}
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
                    setNewEntity((prev) => ({
                      ...prev,
                      acquiredAt: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
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
                    setNewEntity((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Notes */}
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
                    setNewEntity((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                disabled={
                  savingEntity ||
                  loadingSpecies ||
                  !newEntity.speciesConfigId ||
                  !newEntity.label.trim()
                }
                className="gap-2 rounded-[12px]"
              >
                <Plus className="size-4" />

                {savingEntity ? "Registering…" : "Register entity"}
              </Button>

              <Button
                asChild
                type="button"
                variant="outline"
                disabled={savingEntity}
              >
                <Link to="/farm-os/species">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default NewEntity;
