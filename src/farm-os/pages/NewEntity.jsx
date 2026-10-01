import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Leaf, Plus } from "lucide-react";

import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import { canWrite } from "../lib/permissions";

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
  const { role, loading: authLoading } = useAuth();

  const [speciesList, setSpeciesList] = useState([]);
  const [loadingSpecies, setLoadingSpecies] = useState(true);
  const [speciesError, setSpeciesError] = useState("");

  const [speciesSearch, setSpeciesSearch] = useState("");

  const [parentEntities, setParentEntities] = useState([]);
  const [loadingParents, setLoadingParents] = useState(true);
  const [parentError, setParentError] = useState("");

  const [newEntity, setNewEntity] = useState({
    speciesConfigId: "",
    trackingMode: "group",
    label: "",
    quantity: "",
    acquiredAt: "",
    location: "",
    notes: "",

    originType: "purchased",

    ageAtAcquisition: "",
    ageUnit: "days",

    birthDate: "",
    birthDatePrecision: "unknown",

    motherType: "not_recorded",
    motherEntityId: "",
    motherExternalReference: "",

    fatherType: "not_recorded",
    fatherEntityId: "",
    fatherExternalReference: "",
  });

    const [savingEntity, setSavingEntity] = useState(false);
    const [pageError, setPageError] = useState("");

    useEffect(() => {
      if (!authLoading && !canWrite(role)) {
        navigate("/farm-os/species", { replace: true });
      }
    }, [authLoading, role, navigate]);

  useEffect(() => {
    async function loadRegistrationData() {
      setLoadingSpecies(true);
      setLoadingParents(true);

      setSpeciesError("");
      setParentError("");

      const speciesRes = await supabase
        .from("species_config")
        .select("id, name, category, tracking_modes")
        .is("archived_at", null)
        .order("name");

      if (speciesRes.error) {
        setSpeciesError(speciesRes.error.message);
        setLoadingSpecies(false);
      } else {
        setSpeciesList(speciesRes.data ?? []);
        setLoadingSpecies(false);
      }

      const parentEntitiesRes = await supabase
        .from("farm_entities")
        .select(
          `
      id,
label,
quantity,
tracking_mode,
species_config (
        id,
        name
      )
    `,
        )
        .eq("status", "active")
        .is("archived_at", null)
        .order("label");

      if (parentEntitiesRes.error) {
        setParentError(parentEntitiesRes.error.message);
        setLoadingParents(false);
        return;
      }

      setParentEntities(parentEntitiesRes.data ?? []);
      setLoadingParents(false);
    }

    loadRegistrationData();
  }, []);

  function handleSpeciesChange(value) {
    setSpeciesSearch(value);

    const matchedSpecies = speciesList.find(
      (species) =>
        species.name.trim().toLowerCase() === value.trim().toLowerCase(),
    );

    const allowedModes = matchedSpecies?.tracking_modes ?? ["group"];

    setNewEntity((prev) => {
      const trackingMode = allowedModes[0] ?? "group";

      return {
        ...prev,
        speciesConfigId: matchedSpecies?.id ?? "",
        trackingMode,

        ...(trackingMode !== "individual"
          ? {
              originType: "purchased",
              ageAtAcquisition: "",
              ageUnit: "days",
              birthDate: "",
              birthDatePrecision: "unknown",

              motherType: "not_recorded",
              motherEntityId: "",
              motherExternalReference: "",

              fatherType: "not_recorded",
              fatherEntityId: "",
              fatherExternalReference: "",
            }
          : {}),
      };
    });
  }
  function getTrackingModesForSpecies(speciesConfigId) {
    const species = speciesList.find((item) => item.id === speciesConfigId);

    return species?.tracking_modes ?? ["group"];
  }

  function getIndividualParentEntities() {
    return parentEntities.filter(
      (entity) => entity.tracking_mode === "individual",
    );
  }

  function calculateEstimatedBirthDate(acquiredAt, ageAtAcquisition, ageUnit) {
    if (!acquiredAt || ageAtAcquisition === "") {
      return null;
    }

    const age = Number(ageAtAcquisition);

    if (!Number.isFinite(age) || age < 0) {
      return null;
    }

    let ageInDays = age;

    if (ageUnit === "months") {
      ageInDays = age * 30.4375;
    } else if (ageUnit === "years") {
      ageInDays = age * 365.25;
    }

    const acquiredDate = new Date(`${acquiredAt}T00:00:00`);

    if (Number.isNaN(acquiredDate.getTime())) {
      return null;
    }

    acquiredDate.setDate(acquiredDate.getDate() - Math.round(ageInDays));

    const year = acquiredDate.getFullYear();
    const month = String(acquiredDate.getMonth() + 1).padStart(2, "0");
    const day = String(acquiredDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  async function handleAddEntity(e) {
    e.preventDefault();

    if (!newEntity.speciesConfigId || !newEntity.label.trim()) {
      return;
    }
    const allowedTrackingModes = getTrackingModesForSpecies(
      newEntity.speciesConfigId,
    );

    if (!allowedTrackingModes.includes(newEntity.trackingMode)) {
      setPageError("Selected tracking mode is not allowed for this species.");
      return;
    }

    if (newEntity.quantity === "") {
      setPageError(
        newEntity.trackingMode === "area"
          ? "Please provide the area or size."
          : "Please provide the quantity.",
      );
      return;
    }

    const quantity = Number(newEntity.quantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setPageError(
        newEntity.trackingMode === "area"
          ? "Area or size must be greater than 0."
          : "Quantity must be greater than 0.",
      );
      return;
    }

    if (newEntity.trackingMode === "individual" && quantity !== 1) {
      setPageError("An individual entity must have quantity 1.");
      return;
    }

    if (
      newEntity.trackingMode === "individual" &&
      newEntity.originType !== "born_on_farm" &&
      newEntity.ageAtAcquisition !== ""
    ) {
      const age = Number(newEntity.ageAtAcquisition);

      if (!Number.isFinite(age) || age < 0) {
        setPageError("Age at acquisition must be a valid non-negative number.");
        return;
      }
    }

    if (
      newEntity.originType === "born_on_farm" &&
      newEntity.trackingMode === "individual" &&
      !newEntity.birthDate
    ) {
      setPageError("Please provide the birth date for a farm-born entity.");
      return;
    }
    if (
      newEntity.originType === "born_on_farm" &&
      newEntity.trackingMode === "individual" &&
      (newEntity.acquiredAt || newEntity.ageAtAcquisition !== "")
    ) {
      setPageError(
        "A farm-born entity cannot have acquisition date or age at acquisition.",
      );
      return;
    }
    if (newEntity.trackingMode === "individual" && newEntity.birthDate) {
      const birthDate = new Date(`${newEntity.birthDate}T00:00:00`);
      const today = new Date();

      today.setHours(0, 0, 0, 0);

      if (birthDate > today) {
        setPageError("Birth date cannot be in the future.");
        return;
      }
    }
    if (
      newEntity.trackingMode === "individual" &&
      newEntity.birthDate &&
      newEntity.acquiredAt
    ) {
      const birthDate = new Date(`${newEntity.birthDate}T00:00:00`);
      const acquiredDate = new Date(`${newEntity.acquiredAt}T00:00:00`);

      if (acquiredDate < birthDate) {
        setPageError("Acquired date cannot be before the birth date.");
        return;
      }
    }
    if (newEntity.trackingMode === "individual" && newEntity.acquiredAt) {
      const acquiredDate = new Date(`${newEntity.acquiredAt}T00:00:00`);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (acquiredDate > today) {
        setPageError("Acquired date cannot be in the future.");
        return;
      }
    }
    if (
      newEntity.originType === "born_on_farm" &&
      newEntity.trackingMode === "individual"
    ) {
      if (newEntity.motherType === "farm_entity" && !newEntity.motherEntityId) {
        setPageError("Please select the farm entity for the mother.");
        return;
      }

      if (newEntity.motherType === "farm_entity") {
        const mother = parentEntities.find(
          (entity) => entity.id === newEntity.motherEntityId,
        );

        if (!mother || mother.tracking_mode !== "individual") {
          setPageError("The selected mother must be an individual entity.");
          return;
        }
      }

      if (
        newEntity.motherType === "external" &&
        !newEntity.motherExternalReference.trim()
      ) {
        setPageError("Please provide a reference for the external mother.");
        return;
      }

      if (newEntity.fatherType === "farm_entity" && !newEntity.fatherEntityId) {
        setPageError("Please select the farm entity for the father.");
        return;
      }

      if (newEntity.fatherType === "farm_entity") {
        const father = parentEntities.find(
          (entity) => entity.id === newEntity.fatherEntityId,
        );

        if (!father || father.tracking_mode !== "individual") {
          setPageError("The selected father must be an individual entity.");
          return;
        }
      }

      if (
        newEntity.fatherType === "external" &&
        !newEntity.fatherExternalReference.trim()
      ) {
        setPageError("Please provide a reference for the external father.");
        return;
      }
    }

    setSavingEntity(true);
    setPageError("");

    const { data: createdEntity, error: entityError } = await supabase
      .from("farm_entities")
      .insert({
        species_config_id: newEntity.speciesConfigId,
        label: newEntity.label.trim(),
        tracking_mode: newEntity.trackingMode,
        quantity: newEntity.quantity !== "" ? Number(newEntity.quantity) : null,
        acquired_at: newEntity.acquiredAt || null,
        location: newEntity.location || null,
        notes: newEntity.notes || null,
        status: "active",
      })
      .select("id")
      .single();

    if (entityError) {
      setSavingEntity(false);
      setPageError(entityError.message);
      return;
    }

    if (newEntity.trackingMode === "individual") {
      let ageAtAcquisitionDays = null;
      let lifecycleBirthDate = newEntity.birthDate || null;
      let lifecycleBirthDatePrecision = newEntity.birthDate
        ? newEntity.birthDatePrecision
        : "unknown";

      if (
        !newEntity.birthDate &&
        newEntity.originType !== "born_on_farm" &&
        newEntity.acquiredAt &&
        newEntity.ageAtAcquisition !== ""
      ) {
        const estimatedBirthDate = calculateEstimatedBirthDate(
          newEntity.acquiredAt,
          newEntity.ageAtAcquisition,
          newEntity.ageUnit,
        );

        if (estimatedBirthDate) {
          lifecycleBirthDate = estimatedBirthDate;
          lifecycleBirthDatePrecision = "estimated";
        }
      }

      if (newEntity.ageAtAcquisition !== "") {
        const age = Number(newEntity.ageAtAcquisition);

        if (newEntity.ageUnit === "days") {
          ageAtAcquisitionDays = Math.round(age);
        } else if (newEntity.ageUnit === "months") {
          ageAtAcquisitionDays = Math.round(age * 30.4375);
        } else if (newEntity.ageUnit === "years") {
          ageAtAcquisitionDays = Math.round(age * 365.25);
        }
      }

      const { error: lifecycleError } = await supabase
        .from("entity_lifecycle")
        .insert({
          entity_id: createdEntity.id,
          origin_type: newEntity.originType,
          birth_date: lifecycleBirthDate,
          birth_date_precision: lifecycleBirthDatePrecision,
          age_at_acquisition_days: ageAtAcquisitionDays,
        });

      if (lifecycleError) {
        await supabase
          .from("farm_entities")
          .delete()
          .eq("id", createdEntity.id);

        setSavingEntity(false);
        setPageError(lifecycleError.message);
        return;
      }
    }

    if (
      newEntity.originType === "born_on_farm" &&
      newEntity.trackingMode === "individual"
    ) {
      const parentageRows = [];

      parentageRows.push({
        child_entity_id: createdEntity.id,
        parent_role: "mother",
        parent_type: newEntity.motherType,
        parent_entity_id:
          newEntity.motherType === "farm_entity"
            ? newEntity.motherEntityId || null
            : null,
        external_reference:
          newEntity.motherType === "external"
            ? newEntity.motherExternalReference.trim() || null
            : null,
      });

      parentageRows.push({
        child_entity_id: createdEntity.id,
        parent_role: "father",
        parent_type: newEntity.fatherType,
        parent_entity_id:
          newEntity.fatherType === "farm_entity"
            ? newEntity.fatherEntityId || null
            : null,
        external_reference:
          newEntity.fatherType === "external"
            ? newEntity.fatherExternalReference.trim() || null
            : null,
      });

      const { error: parentageError } = await supabase
        .from("entity_parentage")
        .insert(parentageRows);

      if (parentageError) {
        await supabase
          .from("entity_lifecycle")
          .delete()
          .eq("entity_id", createdEntity.id);

        await supabase
          .from("farm_entities")
          .delete()
          .eq("id", createdEntity.id);

        setSavingEntity(false);
        setPageError(parentageError.message);
        return;
      }
    }

    setSavingEntity(false);

    navigate(`/farm-os/entities/${createdEntity.id}`);
  }

  const hasExactSpeciesMatch = speciesList.some(
    (species) =>
      species.name.trim().toLowerCase() === speciesSearch.trim().toLowerCase(),
  );

    if (authLoading || !canWrite(role)) {
      return null;
    }

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
              <p className="text-sm font-medium text-destructive">
                {pageError}
              </p>
            </CardContent>
          </Card>
        )}

        {speciesError && (
          <Card className="border-destructive/30 bg-destructive/[0.03]">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-destructive">
                Unable to load species and crop configurations.
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {speciesError}
              </p>
            </CardContent>
          </Card>
        )}

        {parentError && (
          <Card className="border-destructive/30 bg-destructive/[0.03]">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-destructive">
                Unable to load existing farm entities.
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {parentError}
              </p>
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
                  <label
                    htmlFor="entity-species"
                    className="text-sm font-medium"
                  >
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

                {/* Tracking mode */}
                <div className="space-y-2 md:col-span-2">
                  <label
                    htmlFor="entity-tracking-mode"
                    className="text-sm font-medium"
                  >
                    Tracking mode
                  </label>

                  <select
                    id="entity-tracking-mode"
                    value={newEntity.trackingMode}
                    onChange={(e) => {
                      const trackingMode = e.target.value;

                      setNewEntity((prev) => ({
                        ...prev,
                        trackingMode,

                        ...(trackingMode !== "individual"
                          ? {
                              originType: "purchased",
                              ageAtAcquisition: "",
                              ageUnit: "days",
                              birthDate: "",
                              birthDatePrecision: "unknown",

                              motherType: "not_recorded",
                              motherEntityId: "",
                              motherExternalReference: "",

                              fatherType: "not_recorded",
                              fatherEntityId: "",
                              fatherExternalReference: "",
                            }
                          : {}),
                      }));
                    }}
                    disabled={!newEntity.speciesConfigId}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {getTrackingModesForSpecies(newEntity.speciesConfigId).map(
                      (mode) => (
                        <option key={mode} value={mode}>
                          {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </option>
                      ),
                    )}
                  </select>

                  <p className="text-xs text-muted-foreground">
                    Choose whether this entity represents one individual, a
                    group, or an area.
                  </p>
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
                    {newEntity.trackingMode === "area"
                      ? "Area / size"
                      : "Quantity"}
                  </label>

                  <Input
                    id="entity-quantity"
                    type="number"
                    step="any"
                    placeholder={
                      newEntity.trackingMode === "area"
                        ? "e.g. 5"
                        : newEntity.trackingMode === "individual"
                          ? "Usually 1"
                          : "e.g. 100"
                    }
                    value={newEntity.quantity}
                    onChange={(e) =>
                      setNewEntity((prev) => ({
                        ...prev,
                        quantity: e.target.value,
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {newEntity.trackingMode === "area"
                      ? "Enter the area using the configured land unit."
                      : newEntity.trackingMode === "individual"
                        ? "An individual entity normally has quantity 1."
                        : "Number of animals or items in this group."}
                  </p>
                </div>

                {/* Origin */}
                <div className="space-y-2 md:col-span-2">
                  <label
                    htmlFor="entity-origin"
                    className="text-sm font-medium"
                  >
                    Origin
                  </label>

                  <select
                    id="entity-origin"
                    value={newEntity.originType}
                    onChange={(e) =>
                      setNewEntity((prev) => ({
                        ...prev,
                        originType: e.target.value,
                        acquiredAt: "",
                        ageAtAcquisition: "",
                        birthDate: "",
                        birthDatePrecision: "unknown",

                        motherType: "not_recorded",
                        motherEntityId: "",
                        motherExternalReference: "",

                        fatherType: "not_recorded",
                        fatherEntityId: "",
                        fatherExternalReference: "",
                      }))
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="purchased">Purchased</option>
                    <option value="born_on_farm">Born on farm</option>
                    <option value="transferred">Transferred</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Age at acquisition */}
                {newEntity.originType !== "born_on_farm" &&
                  newEntity.trackingMode === "individual" && (
                    <div className="space-y-2">
                      <label
                        htmlFor="entity-age"
                        className="text-sm font-medium"
                      >
                        Age at acquisition
                      </label>

                      <div className="flex gap-2">
                        <Input
                          id="entity-age"
                          type="number"
                          min="0"
                          step="any"
                          placeholder="e.g. 3"
                          value={newEntity.ageAtAcquisition}
                          onChange={(e) =>
                            setNewEntity((prev) => ({
                              ...prev,
                              ageAtAcquisition: e.target.value,
                            }))
                          }
                        />

                        <select
                          value={newEntity.ageUnit}
                          onChange={(e) =>
                            setNewEntity((prev) => ({
                              ...prev,
                              ageUnit: e.target.value,
                            }))
                          }
                          className="h-9 w-[120px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="days">Days</option>
                          <option value="months">Months</option>
                          <option value="years">Years</option>
                        </select>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Age when the entity was acquired.
                      </p>
                    </div>
                  )}

                {/* Lifecycle information */}
                {newEntity.originType !== "born_on_farm" &&
                  newEntity.trackingMode === "individual" && (
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
                  )}

                {/* Birth date */}
                {newEntity.trackingMode === "individual" && (
                  <div className="space-y-2">
                    <label
                      htmlFor="entity-birth-date"
                      className="text-sm font-medium"
                    >
                      Birth date
                    </label>

                    <Input
                      id="entity-birth-date"
                      type="date"
                      value={newEntity.birthDate}
                      onChange={(e) =>
                        setNewEntity((prev) => ({
                          ...prev,
                          birthDate: e.target.value,
                          birthDatePrecision: e.target.value
                            ? prev.birthDatePrecision === "unknown"
                              ? "exact"
                              : prev.birthDatePrecision
                            : "unknown",
                        }))
                      }
                    />

                    <p className="text-xs text-muted-foreground">
                      {newEntity.originType === "born_on_farm"
                        ? "Required for farm-born entities."
                        : "Leave empty if the birth date is not known."}
                    </p>
                  </div>
                )}

                {/* Birth date precision */}
                {newEntity.birthDate && (
                  <div className="space-y-2">
                    <label
                      htmlFor="entity-birth-date-precision"
                      className="text-sm font-medium"
                    >
                      Birth date precision
                    </label>

                    <select
                      id="entity-birth-date-precision"
                      value={newEntity.birthDatePrecision}
                      onChange={(e) =>
                        setNewEntity((prev) => ({
                          ...prev,
                          birthDatePrecision: e.target.value,
                        }))
                      }
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="exact">Exact</option>
                      <option value="estimated">Estimated</option>
                      <option value="approximate">Approximate</option>
                    </select>
                  </div>
                )}

                {/* Parentage - Mother */}
                {newEntity.originType === "born_on_farm" &&
                  newEntity.trackingMode === "individual" && (
                    <div className="space-y-4 md:col-span-2">
                      <div>
                        <h3 className="text-sm font-semibold">Mother</h3>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Record where the mother came from, if known.
                        </p>
                      </div>

                      {/* Mother type */}
                      <div className="space-y-2">
                        <label
                          htmlFor="mother-type"
                          className="text-sm font-medium"
                        >
                          Mother type
                        </label>

                        <select
                          id="mother-type"
                          value={newEntity.motherType}
                          onChange={(e) =>
                            setNewEntity((prev) => ({
                              ...prev,
                              motherType: e.target.value,
                              motherEntityId: "",
                              motherExternalReference: "",
                            }))
                          }
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="farm_entity">Farm entity</option>
                          <option value="external">External</option>
                          <option value="unknown">Unknown</option>
                          <option value="not_recorded">Not recorded</option>
                        </select>
                      </div>

                      {/* Mother farm entity */}
                      {newEntity.motherType === "farm_entity" && (
                        <div className="space-y-2">
                          <label
                            htmlFor="mother-entity"
                            className="text-sm font-medium"
                          >
                            Mother farm entity
                          </label>

                          <select
                            id="mother-entity"
                            value={newEntity.motherEntityId}
                            onChange={(e) =>
                              setNewEntity((prev) => ({
                                ...prev,
                                motherEntityId: e.target.value,
                              }))
                            }
                            disabled={loadingParents}
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <option value="">
                              {loadingParents
                                ? "Loading farm entities..."
                                : "Select mother"}
                            </option>

                            {getIndividualParentEntities().map((entity) => (
                              <option key={entity.id} value={entity.id}>
                                {entity.species_config?.name
                                  ? `${entity.species_config.name} — ${entity.label}`
                                  : entity.label}
                              </option>
                            ))}
                          </select>

                          {!loadingParents && parentEntities.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                              No active farm entities are available.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Mother external reference */}
                      {newEntity.motherType === "external" && (
                        <div className="space-y-2">
                          <label
                            htmlFor="mother-external-reference"
                            className="text-sm font-medium"
                          >
                            External mother reference
                          </label>

                          <Input
                            id="mother-external-reference"
                            type="text"
                            placeholder="e.g. Neighbor's goat"
                            value={newEntity.motherExternalReference}
                            onChange={(e) =>
                              setNewEntity((prev) => ({
                                ...prev,
                                motherExternalReference: e.target.value,
                              }))
                            }
                          />

                          <p className="text-xs text-muted-foreground">
                            Use this for a parent that belongs to another farm
                            or is otherwise outside FarmOS.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                {/* Parentage - Father */}
                {newEntity.originType === "born_on_farm" &&
                  newEntity.trackingMode === "individual" && (
                    <div className="space-y-4 md:col-span-2">
                      <div>
                        <h3 className="text-sm font-semibold">Father</h3>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Record where the father came from, if known.
                        </p>
                      </div>

                      {/* Father type */}
                      <div className="space-y-2">
                        <label
                          htmlFor="father-type"
                          className="text-sm font-medium"
                        >
                          Father type
                        </label>

                        <select
                          id="father-type"
                          value={newEntity.fatherType}
                          onChange={(e) =>
                            setNewEntity((prev) => ({
                              ...prev,
                              fatherType: e.target.value,
                              fatherEntityId: "",
                              fatherExternalReference: "",
                            }))
                          }
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="farm_entity">Farm entity</option>
                          <option value="external">External</option>
                          <option value="unknown">Unknown</option>
                          <option value="not_recorded">Not recorded</option>
                        </select>
                      </div>

                      {/* Father farm entity */}
                      {newEntity.fatherType === "farm_entity" && (
                        <div className="space-y-2">
                          <label
                            htmlFor="father-entity"
                            className="text-sm font-medium"
                          >
                            Father farm entity
                          </label>

                          <select
                            id="father-entity"
                            value={newEntity.fatherEntityId}
                            onChange={(e) =>
                              setNewEntity((prev) => ({
                                ...prev,
                                fatherEntityId: e.target.value,
                              }))
                            }
                            disabled={loadingParents}
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <option value="">
                              {loadingParents
                                ? "Loading farm entities..."
                                : "Select father"}
                            </option>

                            {getIndividualParentEntities().map((entity) => (
                              <option key={entity.id} value={entity.id}>
                                {entity.species_config?.name
                                  ? `${entity.species_config.name} — ${entity.label}`
                                  : entity.label}
                              </option>
                            ))}
                          </select>

                          {!loadingParents && parentEntities.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                              No active farm entities are available.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Father external reference */}
                      {newEntity.fatherType === "external" && (
                        <div className="space-y-2">
                          <label
                            htmlFor="father-external-reference"
                            className="text-sm font-medium"
                          >
                            External father reference
                          </label>

                          <Input
                            id="father-external-reference"
                            type="text"
                            placeholder="e.g. Neighbor's buck"
                            value={newEntity.fatherExternalReference}
                            onChange={(e) =>
                              setNewEntity((prev) => ({
                                ...prev,
                                fatherExternalReference: e.target.value,
                              }))
                            }
                          />

                          <p className="text-xs text-muted-foreground">
                            Use this for a parent that belongs to another farm
                            or is otherwise outside FarmOS.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

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