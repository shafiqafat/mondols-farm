import { useEffect, useMemo, useState } from "react";
import { FolderKanban, Plus, CalendarDays, Users, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { supabase } from "../lib/supabaseClient";

function Projects() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
const [projectEntityCounts, setProjectEntityCounts] = useState({});
const [loading, setLoading] = useState(true);
const [pageError, setPageError] = useState("");

const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;

    async function fetchProjects() {
      const [projectsResult, assignmentsResult] = await Promise.all([
        supabase
          .from("farm_projects")
          .select("*")
          .order("started_at", { ascending: false }),

        supabase
          .from("farm_project_entities")
          .select("project_id, entity_id")
          .is("ended_at", null),
      ]);

      if (cancelled) return;

      if (projectsResult.error) {
        setPageError(projectsResult.error.message);
        setProjects([]);
        setLoading(false);
        return;
      }

      if (assignmentsResult.error) {
        setPageError(assignmentsResult.error.message);
        setProjects([]);
        setLoading(false);
        return;
      }

      const counts = {};

      for (const assignment of assignmentsResult.data ?? []) {
        counts[assignment.project_id] =
          (counts[assignment.project_id] ?? 0) + 1;
      }

      setProjectEntityCounts(counts);

      if (cancelled) return;

      setProjects(projectsResult.data ?? []);
      setLoading(false);
    }

    fetchProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesStatus =
        statusFilter === "all" || project.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [project.name, project.project_type, project.purpose]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [projects, search, statusFilter]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Farm projects</p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Projects
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage production projects, assign farm entities, track progress,
            and keep the complete project history in one place.
          </p>
        </div>

        <Button
          className="rounded-xl"
          onClick={() => navigate("/farm-os/projects/new")}
        >
          <Plus className="mr-2 size-4" />
          New project
        </Button>
      </div>

      {/* Filters */}
      {!loading && projects.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search projects..."
              className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary"
            />
          </div>

          <div className="flex shrink-0 gap-2">
            {[
              { key: "all", label: "All" },
              { key: "active", label: "Active" },
              { key: "completed", label: "Completed" },
            ].map((filter) => (
              <Button
                key={filter.key}
                type="button"
                size="sm"
                variant={statusFilter === filter.key ? "default" : "outline"}
                className="rounded-xl"
                onClick={() => setStatusFilter(filter.key)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {pageError && (
        <Card className="rounded-2xl border-destructive/30">
          <CardContent className="p-5">
            <p className="text-sm text-destructive">{pageError}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <Card className="rounded-2xl border-border/70">
          <CardContent className="flex min-h-[240px] items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading projects...</p>
          </CardContent>
        </Card>
      )}

      {/* Empty */}
      {!loading && !pageError && projects.length === 0 && (
        <Card className="rounded-2xl border-border/70">
          <CardContent className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FolderKanban className="size-6" />
            </div>

            <h2 className="mt-5 text-lg font-semibold">Your farm projects</h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Production projects will appear here once you create them.
            </p>

            <Button
              className="mt-6 rounded-xl"
              onClick={() => navigate("/farm-os/projects/new")}
            >
              <Plus className="mr-2 size-4" />
              Create your first project
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading &&
        !pageError &&
        projects.length > 0 &&
        filteredProjects.length === 0 && (
          <Card className="rounded-2xl border-border/70">
            <CardContent className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Search className="size-6" />
              </div>

              <h2 className="mt-5 text-lg font-semibold">
                No matching projects
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Try a different search term or change the project status filter.
              </p>

              <Button
                type="button"
                variant="outline"
                className="mt-5 rounded-xl"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
              >
                Clear filters
              </Button>
            </CardContent>
          </Card>
        )}

      {/* Projects */}
      {!loading && filteredProjects.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="rounded-2xl border-border/70 transition-colors hover:border-primary/30"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold">
                      {project.name}
                    </h2>

                    {project.project_type && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {project.project_type}
                      </p>
                    )}
                  </div>

                  <Badge
                    variant={
                      project.status === "active" ? "default" : "secondary"
                    }
                    className="shrink-0 capitalize"
                  >
                    {project.status}
                  </Badge>
                </div>

                {project.purpose && (
                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {project.purpose}
                  </p>
                )}

                <div className="mt-5 space-y-2 border-t border-border/60 pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="size-4 shrink-0" />
                    <span>
                      Started{" "}
                      {project.started_at
                        ? project.started_at
                        : "Not specified"}
                    </span>
                  </div>

                  {project.target_end_at && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="size-4 shrink-0" />
                      <span>Target {project.target_end_at}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="size-4 shrink-0" />

                    <span>
                      {projectEntityCounts[project.id] ?? 0}{" "}
                      {(projectEntityCounts[project.id] ?? 0) === 1
                        ? "entity"
                        : "entities"}{" "}
                      assigned
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="mt-5 w-full rounded-xl"
                  onClick={() => navigate(`/farm-os/projects/${project.id}`)}
                >
                  View project
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default Projects;
