import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { Link } from "react-router-dom";
import {
  Archive,
  CircleDot,
  RotateCcw,
  Trash2,
  Plus,
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

gsap.registerPlugin(Flip);

const LIVESTOCK_STATUS_OPTIONS = ["active", "sold", "deceased"];
const CROP_STATUS_OPTIONS = ["active", "harvested"];

function getStatusOptions(entity) {
  const category = entity.species_config?.category;

  if (category === "crop" || category === "fodder") {
    return CROP_STATUS_OPTIONS;
  }

  return LIVESTOCK_STATUS_OPTIONS;
}

function FarmEntityList({
  entities,
  onStatusChange,
  onArchive,
  onRestore,
  onDelete,
  updatingStatusId,
  actionId,
  updatedEntityId,
}) {
  const [entityFilter, setEntityFilter] = useState("all");
  const [entitySearch, setEntitySearch] = useState("");
  const entityListRef = useRef(null);

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

  const activeEntities = entities.filter(
    (entity) => entity.status === "active" && !entity.archived_at,
  );

  const filteredEntities = entities.filter((entity) => {
    const isArchived = Boolean(entity.archived_at);

    const matchesLifecycle =
      entityFilter === "archived" ? isArchived : !isArchived;

    const matchesStatus =
      entityFilter === "all" ||
      entityFilter === "archived" ||
      entity.status === entityFilter;

    const query = entitySearch.trim().toLowerCase();

    const matchesSearch =
      !query ||
      entity.label?.toLowerCase().includes(query) ||
      entity.species_config?.name?.toLowerCase().includes(query);

    return matchesLifecycle && matchesStatus && matchesSearch;
  });

  const statusOptions = [
    ...new Set([...LIVESTOCK_STATUS_OPTIONS, ...CROP_STATUS_OPTIONS]),
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Farm entities</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Register the actual animals, groups, plots, and operating units on
            your farm.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <CircleDot className="size-3.5 text-primary" />
            {activeEntities.length} active
          </div>

          <Button
            asChild
            size="sm"
            className="!inline-flex !w-fit !flex-row !items-center !justify-center gap-2 rounded-[12px] whitespace-nowrap px-3.5"
          >
            <Link
              to="/farm-os/entities/new"
              className="!inline-flex !w-fit !flex-row !items-center gap-2 whitespace-nowrap"
            >
              <Plus className="size-4 shrink-0" />
              <span className="whitespace-nowrap">Register New Entity</span>
            </Link>
          </Button>
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
              onChange={(event) => setEntitySearch(event.target.value)}
              placeholder="Search entities…"
              className="sm:w-52"
            />

            <select
              value={entityFilter}
              onChange={(event) => setEntityFilter(event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm capitalize shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All statuses</option>
              <option value="archived">Archived</option>
              {statusOptions.map((status) => (
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

                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                    {entity.archived_at ? (
                      <>
                        <Badge
                          variant="outline"
                          className="w-full justify-center gap-1.5 sm:w-auto"
                        >
                          <Archive className="size-3.5" />
                          Archived
                        </Badge>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          disabled={actionId === entity.id}
                          onClick={() => onRestore(entity.id)}
                        >
                          <RotateCcw className="size-3.5" />
                          {actionId === entity.id ? "Restoring…" : "Restore"}
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={actionId === entity.id}
                          onClick={() => onDelete(entity.id)}
                        >
                          <Trash2 className="size-3.5" />
                          Delete
                        </Button>
                      </>
                    ) : (
                      <>
                        {entity.status === "active" ? (
                          <select
                            value={entity.status}
                            onChange={(event) =>
                              onStatusChange(entity.id, event.target.value)
                            }
                            disabled={updatingStatusId === entity.id}
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

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="gap-1.5"
                          disabled={actionId === entity.id}
                          onClick={() => onArchive(entity.id)}
                        >
                          <Archive className="size-3.5" />
                          {actionId === entity.id ? "Archiving…" : "Archive"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

export default FarmEntityList;
