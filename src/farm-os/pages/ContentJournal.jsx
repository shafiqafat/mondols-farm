import { useEffect, useState } from "react";
import {
  ArrowRight,
  ClipboardPenLine,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { localDateISO } from "../lib/localDate";
import {
  STAGES,
  STAGE_LABEL,
  nextStage,
} from "../engines/contentJournalEngine";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function ContentJournal() {
  const [items, setItems] = useState([]);
  const [entities, setEntities] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pageError, setPageError] = useState("");

  const [form, setForm] = useState({
    title: "",
    type: "mixed",
    entityId: "",
    projectId: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [advancingId, setAdvancingId] = useState(null);

  async function loadAll() {
    setLoading(true);
    setLoadError("");

    const [itemsRes, entitiesRes, projectsRes] = await Promise.all([
      supabase
        .from("content_items")
        .select("*, entity:entity_id(label), project:project_id(name)")
        .order("created_at", { ascending: false }),
      supabase.from("farm_entities").select("id, label").order("label"),
      supabase.from("farm_projects").select("id, name").order("name"),
    ]);

    if (itemsRes.error) {
      setLoadError(itemsRes.error.message);
      setLoading(false);
      return;
    }

    setItems(itemsRes.data ?? []);
    setEntities(entitiesRes.data ?? []);
    setProjects(projectsRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setPageError("");

    const { error } = await supabase.from("content_items").insert({
      title: form.title.trim(),
      type: form.type,
      entity_id: form.entityId || null,
      project_id: form.projectId || null,
      notes: form.notes || null,
      stage: "idea",
      occurred_at: localDateISO(),
    });

    setSaving(false);
    if (error) {
      setPageError(error.message);
      return;
    }
    setForm({
      title: "",
      type: "mixed",
      entityId: "",
      projectId: "",
      notes: "",
    });
    loadAll();
  }

  async function handleAdvance(item) {
    const next = nextStage(item.stage);
    if (!next) return;
    setAdvancingId(item.id);
    const { error } = await supabase
      .from("content_items")
      .update({ stage: next })
      .eq("id", item.id);
    setAdvancingId(null);
    if (error) {
      setPageError(error.message);
      return;
    }
    loadAll();
  }

  if (loading) {
    return (
      <Card className="border-border/70 bg-card shadow-sm">
        <CardContent className="flex min-h-32 items-center justify-center p-5">
          <p className="text-sm text-muted-foreground">
            Loading content journal…
          </p>
        </CardContent>
      </Card>
    );
  }
  if (loadError) {
    return (
      <Card className="border-destructive/30 bg-card shadow-sm">
        <CardContent className="p-5">
          <p className="text-sm text-destructive">{loadError}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ClipboardPenLine className="size-4" />
        </div>

        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em]">
            Content Journal
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Capture farm stories and move them from idea to published content.
            Link each piece back to the entity or project it belongs to.
          </p>
        </div>
      </div>

      {pageError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">{pageError}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STAGES.map((stage) => (
          <Card key={stage} className="border-border/70 bg-card shadow-sm">
            <CardContent className="p-4">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">{STAGE_LABEL[stage]}</h2>

                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {items.filter((i) => i.stage === stage).length}
                </span>
              </div>

              {items.filter((i) => i.stage === stage).length === 0 ? (
                <p className="rounded-lg border border-dashed border-border/70 px-3 py-6 text-center text-xs text-muted-foreground">
                  Nothing here yet.
                </p>
              ) : (
                items
                  .filter((i) => i.stage === stage)
                  .map((item) => {
                    const next = nextStage(item.stage);

                    return (
                      <Card
                        key={item.id}
                        className="mb-3 border-border/70 bg-background shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <CardContent className="space-y-3 p-4">
                          <h3 className="text-sm font-semibold text-foreground">
                            {item.title}
                          </h3>

                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs capitalize text-muted-foreground">
                            <span>{item.type}</span>

                            {item.entity && <span>· {item.entity.label}</span>}

                            {item.project && <span>· {item.project.name}</span>}
                          </div>

                          {item.notes && (
                            <p className="text-sm leading-5 text-muted-foreground">
                              {item.notes}
                            </p>
                          )}

                          {next && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => handleAdvance(item)}
                              disabled={advancingId === item.id}
                            >
                              {advancingId === item.id
                                ? "Moving…"
                                : `Move to ${STAGE_LABEL[next]}`}

                              {advancingId !== item.id && (
                                <ArrowRight className="size-4" />
                              )}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <form
        className="rounded-xl border border-border/70 bg-card p-5 shadow-sm"
        onSubmit={handleAdd}
      >
        <div className="mb-5 flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ClipboardPenLine className="size-4" />
          </div>

          <div>
            <h2 className="text-base font-semibold">New content idea</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Capture an idea and optionally link it to a farm entity or
              project.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2 lg:col-span-2">
            <label htmlFor="content-title" className="text-sm font-medium">
              Title
            </label>

            <Input
              id="content-title"
              type="text"
              placeholder="e.g. Goat kidding day"
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="content-type" className="text-sm font-medium">
              Type
            </label>

            <select
              id="content-type"
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="mixed">Mixed</option>
              <option value="photo">Photo</option>
              <option value="video">Video</option>
              <option value="note">Note</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="content-entity" className="text-sm font-medium">
              Entity
            </label>

            <select
              id="content-entity"
              value={form.entityId}
              onChange={(e) =>
                setForm((p) => ({ ...p, entityId: e.target.value }))
              }
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">No entity</option>

              {entities.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="content-project" className="text-sm font-medium">
              Project
            </label>

            <select
              id="content-project"
              value={form.projectId}
              onChange={(e) =>
                setForm((p) => ({ ...p, projectId: e.target.value }))
              }
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">No project</option>

              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <label htmlFor="content-notes" className="text-sm font-medium">
            Notes
          </label>

          <Textarea
            id="content-notes"
            placeholder="Optional notes"
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            rows={3}
          />
        </div>

        <div className="mt-5 flex justify-end border-t border-border/60 pt-5">
          <Button type="submit" disabled={saving}>
            {saving ? "Adding…" : "Add idea"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default ContentJournal;
