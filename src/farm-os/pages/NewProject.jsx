import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { supabase } from "../lib/supabaseClient";
import { localDateISO } from "../lib/localDate";
import { useAuth } from "../hooks/useAuth";
import { canWrite } from "../lib/permissions";

function NewProject() {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();

  const [form, setForm] = useState({
    name: "",
    projectType: "",
    purpose: "",
    startedAt: localDateISO(),
    targetEndAt: "",
  });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [entities, setEntities] = useState([]);
    const [selectedEntityIds, setSelectedEntityIds] = useState([]);
    const [entitiesLoading, setEntitiesLoading] = useState(true);
    const [createdProjectId, setCreatedProjectId] = useState(null);

    useEffect(() => {
      if (!authLoading && !canWrite(role)) {
        navigate("/farm-os/projects", { replace: true });
      }
    }, [authLoading, role, navigate]);

    useEffect(() => {
  
async function loadEntities() {
  setEntitiesLoading(true);
  setError("");

  const [
    { data: entityRows, error: entityError },
    { data: assignmentRows, error: assignmentError },
  ] = await Promise.all([
    supabase
      .from("farm_entities")
      .select(
        `
        id,
        label,
        quantity,
        status,
        archived_at,
        species_config:species_config_id (
          id,
          name,
          category
        )
      `,
      )
      .eq("status", "active")
      .is("archived_at", null)
      .order("label", { ascending: true }),

    supabase
      .from("farm_project_entities")
      .select("entity_id, project_id, ended_at"),
  ]);

  if (entityError || assignmentError) {
    setError(
      `Could not load available entities: ${
        entityError?.message || assignmentError?.message
      }`,
    );
    setEntities([]);
    setEntitiesLoading(false);
    return;
  }

  const assignedElsewhere = new Set(
    (assignmentRows || [])
      .filter((assignment) => assignment.ended_at === null)
      .map((assignment) => assignment.entity_id),
  );

  setEntities(
    (entityRows || []).filter((entity) => !assignedElsewhere.has(entity.id)),
  );

  setEntitiesLoading(false);
}

  loadEntities();
}, []);

  function handleChange(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function toggleEntity(entityId) {
    setSelectedEntityIds((prev) =>
      prev.includes(entityId)
        ? prev.filter((id) => id !== entityId)
        : [...prev, entityId],
    );
  }

  
async function handleSubmit(event) {
  event.preventDefault();

  if (!form.name.trim()) {
    setError("Project name is required.");
    return;
  }

  if (form.targetEndAt && form.startedAt && form.targetEndAt < form.startedAt) {
    setError("Target end date cannot be before the start date.");
    return;
  }

  setSaving(true);
  setError("");

  const startedAt = form.startedAt || localDateISO();

  // Check selected entities again immediately before creation.
  if (selectedEntityIds.length > 0) {
    const { data: assignments, error: checkError } = await supabase
      .from("farm_project_entities")
      .select("entity_id, project_id, started_at, ended_at")
      .in("entity_id", selectedEntityIds);

    if (checkError) {
      setError(`Could not verify entity assignments: ${checkError.message}`);
      setSaving(false);
      return;
    }

    const conflicts = (assignments || []).filter(
      (assignment) =>
        assignment.started_at <= startedAt &&
        (!assignment.ended_at || startedAt < assignment.ended_at),
    );

    if (conflicts.length > 0) {
      setError(
        `${conflicts.length} selected entity or entities already have a project assignment on ${startedAt}. Refresh the page and select only available entities.`,
      );
      setSaving(false);
      return;
    }
  }

  const { data, error: insertError } = await supabase
    .from("farm_projects")
    .insert({
      name: form.name.trim(),
      project_type: form.projectType.trim() || null,
      purpose: form.purpose.trim() || null,
      started_at: startedAt,
      target_end_at: form.targetEndAt || null,
      status: "active",
    })
    .select("id")
    .single();

  if (insertError) {
    setError(insertError.message);
    setSaving(false);
    return;
  }

  setCreatedProjectId(data.id);

  for (const entityId of selectedEntityIds) {
    const { error: assignmentError } = await supabase.rpc(
      "assign_entity_to_project",
      {
        p_entity_id: entityId,
        p_project_id: data.id,
        p_role: "primary",
        p_started_at: startedAt,
      },
    );

    if (assignmentError) {
      setError(
        `The project was created, but an entity could not be assigned: ${assignmentError.message}. Open the project to review and complete its assignments.`,
      );
      setSaving(false);
      return;
    }
  }

  navigate(`/farm-os/projects/${data.id}`);
}


    if (authLoading || !canWrite(role)) {
      return null;
    }

    return (
      <div className="mx-auto w-full max-w-3xl space-y-8">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mt-0.5 shrink-0 rounded-xl"
            onClick={() => navigate("/farm-os/projects")}
          >
            <ArrowLeft className="size-4" />
          </Button>

          <div>
            <p className="text-sm font-medium text-primary">Farm projects</p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              New project
            </h1>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Create a production project and define its basic operating
              context.
            </p>
          </div>
        </div>

        {/* Form */}
        <Card className="rounded-2xl border-border/70">
          <CardHeader>
            <CardTitle className="text-lg">Project details</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project name */}
              <div className="space-y-2">
                <label
                  htmlFor="project-name"
                  className="text-sm font-medium leading-none"
                >
                  Project name
                </label>

                <Input
                  id="project-name"
                  value={form.name}
                  onChange={(event) => handleChange("name", event.target.value)}
                  placeholder="e.g. Quail Egg Production — Batch 01"
                  className="h-11 rounded-xl mt-1"
                  autoFocus
                />
              </div>

              {/* Project type */}
              <div className="space-y-2">
                <label
                  htmlFor="project-type"
                  className="text-sm font-medium leading-none"
                >
                  Project type
                </label>

                <Input
                  id="project-type"
                  value={form.projectType}
                  onChange={(event) =>
                    handleChange("projectType", event.target.value)
                  }
                  placeholder="e.g. Livestock, Poultry, Crop"
                  className="h-11 rounded-xl mt-1"
                />

                <p className="text-xs leading-5 text-muted-foreground">
                  Use a broad production category. This should not be tied to a
                  hard-coded species.
                </p>
              </div>

              {/* Existing flocks */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium">
                    Existing flocks and entities
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Select the existing flocks to assign to this project.
                    Selecting a flock will not create a duplicate entity.
                  </p>
                </div>

                {entitiesLoading ? (
                  <p className="text-sm text-muted-foreground">
                    Loading existing entities...
                  </p>
                ) : entities.length === 0 ? (
                  <p className="rounded-xl border border-border/70 p-4 text-sm text-muted-foreground">
                    No active entities are available. You can create the project
                    now and assign entities later.
                  </p>
                ) : (
                  <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-border/70 p-3">
                    {entities.map((entity) => (
                      <label
                        key={entity.id}
                        className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-muted/50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEntityIds.includes(entity.id)}
                          onChange={() => toggleEntity(entity.id)}
                          className="mt-1 size-4 shrink-0 accent-primary"
                        />

                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium">
                            {entity.label || "Unnamed entity"}
                          </span>

                          <span className="mt-1 block text-xs text-muted-foreground">
                            {entity.species_config?.name || "Unknown species"}
                            {" · "}
                            Quantity: {entity.quantity ?? "Not recorded"}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Selected: {selectedEntityIds.length}
                </p>
              </div>

              {/* Purpose */}
              <div className="space-y-2">
                <label
                  htmlFor="project-purpose"
                  className="text-sm font-medium leading-none"
                >
                  Purpose
                </label>

                <Textarea
                  id="project-purpose"
                  value={form.purpose}
                  onChange={(event) =>
                    handleChange("purpose", event.target.value)
                  }
                  placeholder="Describe what this project is intended to produce or achieve."
                  className="min-h-28 resize-y rounded-xl mt-1"
                />
              </div>

              {/* Dates */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="project-start"
                    className="text-sm font-medium leading-none"
                  >
                    Start date
                  </label>

                  <Input
                    id="project-start"
                    type="date"
                    value={form.startedAt}
                    onChange={(event) =>
                      handleChange("startedAt", event.target.value)
                    }
                    className="h-11 rounded-xl mt-1"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="project-target-end"
                    className="text-sm font-medium leading-none"
                  >
                    Target end date
                  </label>

                  <Input
                    id="project-target-end"
                    type="date"
                    value={form.targetEndAt}
                    onChange={(event) =>
                      handleChange("targetEndAt", event.target.value)
                    }
                    className="h-11 rounded-xl mt-1"
                  />

                  <p className="text-xs leading-5 text-muted-foreground">
                    Optional. You can complete the project manually later.
                  </p>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-6 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => navigate("/farm-os/projects")}
                  disabled={saving}
                >
                  Cancel
                </Button>

                {createdProjectId && (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() =>
                      navigate(`/farm-os/projects/${createdProjectId}`)
                    }
                  >
                    Open created project
                  </Button>
                )}

                <Button
                  type="submit"
                  className="rounded-xl px-4"
                  disabled={saving || Boolean(createdProjectId)}
                >
                  <Save className="mr-1 size-4" />
                  {saving ? "Creating..." : "Create project"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
}

export default NewProject;
