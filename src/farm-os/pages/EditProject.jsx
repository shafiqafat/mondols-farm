import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { supabase } from "../lib/supabaseClient";
import { localDateISO } from "../lib/localDate";

function EditProject() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    name: "",
    projectType: "",
    purpose: "",
    startedAt: "",
    targetEndAt: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProject() {
      setLoading(true);
      setError("");

      const { data, error: fetchError } = await supabase
        .from("farm_projects")
        .select(
          "id, name, project_type, purpose, started_at, target_end_at, status",
        )
        .eq("id", id)
        .single();

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      if (data.status !== "active") {
        setError("Only active projects can be edited.");
        setLoading(false);
        return;
      }

      setForm({
        name: data.name ?? "",
        projectType: data.project_type ?? "",
        purpose: data.purpose ?? "",
        startedAt: data.started_at ?? localDateISO(),
        targetEndAt: data.target_end_at ?? "",
      });

      setLoading(false);
    }

    loadProject();
  }, [id]);

  function handleChange(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Project name is required.");
      return;
    }

    setSaving(true);
    setError("");

    const { error: updateError } = await supabase
      .from("farm_projects")
      .update({
        name: form.name.trim(),
        project_type: form.projectType.trim() || null,
        purpose: form.purpose.trim() || null,
        started_at: form.startedAt || null,
        target_end_at: form.targetEndAt || null,
      })
      .eq("id", id)
      .eq("status", "active");

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    navigate(`/farm-os/projects/${id}`);
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-2xl border border-border/70 bg-card p-6">
          <p className="text-sm text-muted-foreground">Loading project…</p>
        </div>
      </div>
    );
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
          onClick={() => navigate(`/farm-os/projects/${id}`)}
        >
          <ArrowLeft className="size-4" />
        </Button>

        <div>
          <p className="text-sm font-medium text-primary">Farm projects</p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Edit project
          </h1>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Update the basic operating context of this project.
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
                onClick={() => navigate(`/farm-os/projects/${id}`)}
                disabled={saving}
              >
                Cancel
              </Button>

              <Button type="submit" className="rounded-xl px-4" disabled={saving}>
                <Save className="mr-1 size-4" />
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default EditProject;
