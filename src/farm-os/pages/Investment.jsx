import { useEffect, useState } from "react";
import {
  CircleDollarSign,
  Users,
  BriefcaseBusiness,
  FolderKanban,
  Plus,
} from "lucide-react";

import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import { canWrite } from "../lib/permissions";

import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function getOpportunityStatusOptions(currentStatus, isEditing) {
  if (!isEditing) {
    return [
      { value: "draft", label: "Draft" },
      { value: "upcoming", label: "Upcoming" },
      { value: "open", label: "Open" },
    ];
  }

  switch (currentStatus) {
    case "draft":
      return [
        { value: "draft", label: "Draft" },
        { value: "upcoming", label: "Upcoming" },
        { value: "open", label: "Open" },
        { value: "cancelled", label: "Cancelled" },
      ];

    case "upcoming":
      return [
        { value: "upcoming", label: "Upcoming" },
        { value: "open", label: "Open" },
        { value: "cancelled", label: "Cancelled" },
      ];

    case "open":
      return [
        { value: "open", label: "Open" },
        { value: "closed", label: "Closed" },
        { value: "cancelled", label: "Cancelled" },
      ];

    case "fully_funded":
      return [
        { value: "fully_funded", label: "Fully funded" },
        { value: "closed", label: "Closed" },
      ];

    case "closed":
      return [{ value: "closed", label: "Closed" }];

    case "cancelled":
      return [{ value: "cancelled", label: "Cancelled" }];

    default:
      return [
        {
          value: currentStatus,
          label: currentStatus ? currentStatus.replace("_", " ") : "Unknown",
        },
      ];
  }
}

function getEmptyOpportunityForm() {
  return {
    title: "",
    description: "",
    projectId: "",
    speciesConfigId: "",
    targetAmount: "",
    minimumAmount: "",
    openedAt: "",
    closesAt: "",
    status: "draft",
    visibility: "private",
  };
}

function formatDateForInput(value) {
  if (!value) return "";

  return String(value).slice(0, 10);
}

function getEmptyInvestmentForm() {
  return {
    investorId: "",
    opportunityId: "",
    committedAmount: "",
    investedAt: "",
    status: "active",
    notes: "",
  };
}

function Investment() {
  const { role } = useAuth();
  const canEdit = canWrite(role);

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [opportunities, setOpportunities] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [species, setSpecies] = useState([]);
  const [investors, setInvestors] = useState([]);

  const [opportunityDialogOpen, setOpportunityDialogOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState(null);
  const [savingOpportunity, setSavingOpportunity] = useState(false);
  const [opportunityError, setOpportunityError] = useState("");

  const [opportunityForm, setOpportunityForm] = useState(
    getEmptyOpportunityForm(),
  );

  const [investmentDialogOpen, setInvestmentDialogOpen] = useState(false);
  const [savingInvestment, setSavingInvestment] = useState(false);
  const [investmentError, setInvestmentError] = useState("");

  const [investmentForm, setInvestmentForm] = useState(
    getEmptyInvestmentForm(),
  );
  async function loadInvestmentOverview() {
    setLoading(true);
    setLoadError("");

    const [
      overviewRes,
      opportunitiesRes,
      projectsRes,
      speciesRes,
      investorsRes,
      investmentsRes,
    ] = await Promise.all([
      supabase.from("investment_overview").select("*").maybeSingle(),

      supabase
        .from("investment_opportunity_overview")
        .select("*")
        .order("opened_at", { ascending: false }),

      supabase.from("farm_projects").select("id, name, status").order("name"),

      supabase
        .from("species_config")
        .select("id, name, category")
        .order("name"),

      supabase
        .from("investors")
        .select("id, name, email, status")
        .order("name"),

      supabase
        .from("investor_portfolio")
        .select("*")
        .order("invested_at", { ascending: false }),
    ]);

    const error =
      overviewRes.error ||
      opportunitiesRes.error ||
      projectsRes.error ||
      speciesRes.error ||
      investorsRes.error ||
      investmentsRes.error;

    if (error) {
      setLoadError(error.message);
      setLoading(false);
      return;
    }

    setOverview(overviewRes.data);
    setOpportunities(opportunitiesRes.data ?? []);
    setProjects(projectsRes.data ?? []);
    setSpecies(speciesRes.data ?? []);
    setInvestments(investmentsRes.data ?? []);
    setInvestors(investorsRes.data ?? []);
    setLoading(false);
  }

  async function handleCreateOpportunity(e) {
    e.preventDefault();

    setOpportunityError("");

    const title = opportunityForm.title.trim();
    const targetAmount = Number(opportunityForm.targetAmount);
    const minimumAmount = opportunityForm.minimumAmount
      ? Number(opportunityForm.minimumAmount)
      : null;

    if (!title) {
      setOpportunityError("Enter an opportunity title.");
      return;
    }

    if (!targetAmount || targetAmount <= 0) {
      setOpportunityError("Enter a valid target amount.");
      return;
    }

    if (
      minimumAmount !== null &&
      (minimumAmount <= 0 || minimumAmount > targetAmount)
    ) {
      setOpportunityError(
        "Minimum amount must be greater than 0 and cannot exceed the target amount.",
      );
      return;
    }

    if (
      opportunityForm.openedAt &&
      opportunityForm.closesAt &&
      opportunityForm.closesAt < opportunityForm.openedAt
    ) {
      setOpportunityError("Closing date cannot be before the opening date.");
      return;
    }

    setSavingOpportunity(true);

    const { error } = await supabase.from("investment_opportunities").insert({
      title,
      description: opportunityForm.description.trim() || null,
      project_id: opportunityForm.projectId || null,
      species_config_id: opportunityForm.speciesConfigId || null,
      target_amount: targetAmount,
      minimum_amount: minimumAmount,
      opened_at: opportunityForm.openedAt || null,
      closes_at: opportunityForm.closesAt || null,
      status: opportunityForm.status,
      visibility: opportunityForm.visibility,
    });

    setSavingOpportunity(false);

    if (error) {
      setOpportunityError(error.message);
      return;
    }

    setOpportunityForm({
      title: "",
      description: "",
      projectId: "",
      speciesConfigId: "",
      targetAmount: "",
      minimumAmount: "",
      openedAt: "",
      closesAt: "",
      status: "draft",
      visibility: "private",
    });

    setOpportunityDialogOpen(false);

    await loadInvestmentOverview();
  }

  async function handleUpdateOpportunity(e) {
    e.preventDefault();

    if (!editingOpportunity) return;

    setOpportunityError("");

    const title = opportunityForm.title.trim();
    const targetAmount = Number(opportunityForm.targetAmount);
    const minimumAmount = opportunityForm.minimumAmount
      ? Number(opportunityForm.minimumAmount)
      : null;

    if (!title) {
      setOpportunityError("Enter an opportunity title.");
      return;
    }

    if (!targetAmount || targetAmount <= 0) {
      setOpportunityError("Enter a valid target amount.");
      return;
    }

    if (
      minimumAmount !== null &&
      (minimumAmount <= 0 || minimumAmount > targetAmount)
    ) {
      setOpportunityError(
        "Minimum amount must be greater than 0 and cannot exceed the target amount.",
      );
      return;
    }

    if (
      opportunityForm.openedAt &&
      opportunityForm.closesAt &&
      opportunityForm.closesAt < opportunityForm.openedAt
    ) {
      setOpportunityError("Closing date cannot be before the opening date.");
      return;
    }

    setSavingOpportunity(true);

    const { error } = await supabase
      .from("investment_opportunities")
      .update({
        title,
        description: opportunityForm.description.trim() || null,
        project_id: opportunityForm.projectId || null,
        species_config_id: opportunityForm.speciesConfigId || null,
        target_amount: targetAmount,
        minimum_amount: minimumAmount,
        opened_at: opportunityForm.openedAt || null,
        closes_at: opportunityForm.closesAt || null,
        status: opportunityForm.status,
        visibility: opportunityForm.visibility,
      })
      .eq("id", editingOpportunity.opportunity_id);

    setSavingOpportunity(false);

    if (error) {
      setOpportunityError(error.message);
      return;
    }

    setEditingOpportunity(null);
    setOpportunityDialogOpen(false);

    await loadInvestmentOverview();
  }
  async function handleCreateInvestment(e) {
    e.preventDefault();

    setInvestmentError("");

    const investorId = investmentForm.investorId;
    const opportunityId = investmentForm.opportunityId || null;
    const committedAmount = Number(investmentForm.committedAmount);

    if (!investorId) {
      setInvestmentError("Select an investor.");
      return;
    }

    if (!committedAmount || committedAmount <= 0) {
      setInvestmentError("Enter a valid committed amount.");
      return;
    }

    if (opportunityId) {
      const opportunity = opportunities.find(
        (item) => item.opportunity_id === opportunityId,
      );

      if (opportunity?.minimum_amount) {
        const minimum = Number(opportunity.minimum_amount);

        if (committedAmount < minimum) {
          setInvestmentError(
            `Investment amount must be at least ৳${minimum.toLocaleString()}.`,
          );
          return;
        }
      }
    }

    setSavingInvestment(true);

    const { error } = await supabase.from("investments").insert({
      investor_id: investorId,
      opportunity_id: opportunityId,
      committed_amount: committedAmount,
      invested_at: investmentForm.investedAt || new Date().toISOString(),
      status: investmentForm.status,
      notes: investmentForm.notes.trim() || null,
    });

    setSavingInvestment(false);

    if (error) {
      setInvestmentError(error.message);
      return;
    }

    setInvestmentForm(getEmptyInvestmentForm());
    setInvestmentDialogOpen(false);

    await loadInvestmentOverview();
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadInvestmentOverview();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Loading investment data…
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="p-6">
          <p className="text-sm font-medium text-destructive">
            Unable to load investment data
          </p>

          <p className="mt-1 text-sm text-muted-foreground">{loadError}</p>
        </CardContent>
      </Card>
    );
  }

  const totalCommitted = Number(overview?.total_committed || 0);
  const totalContributed = Number(overview?.total_contributed || 0);
  const totalAllocated = Number(overview?.total_allocated || 0);
  const unallocatedContributions = Number(
    overview?.unallocated_contributions || 0,
  );

  const activeInvestors = Number(overview?.active_investors || 0);
  const totalInvestments = Number(overview?.total_investments || 0);
  const activeInvestments = Number(overview?.active_investments || 0);
  const projectsFunded = Number(overview?.projects_funded || 0);

  return (
    <div className="space-y-12">
      <section className="border-b border-border/60 pb-7">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            <CircleDollarSign className="size-4 text-primary" />
            <span>Farm capital</span>
          </div>

          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">
              Investment
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Track investor commitments, contributed funds, project
              allocations, and the farm's overall investment position.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card className="border-border/70 bg-card shadow-sm">
          <CardContent className="p-6">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Total committed
            </p>

            <p className="mt-2 text-4xl font-semibold tracking-[-0.03em]">
              ৳{totalCommitted.toLocaleString()}
            </p>

            <p className="mt-1.5 text-sm text-muted-foreground">
              Capital investors have committed to the farm.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card shadow-sm">
          <CardContent className="p-6">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Total raised
            </p>

            <p className="mt-2 text-4xl font-semibold tracking-[-0.03em] text-primary">
              ৳{totalContributed.toLocaleString()}
            </p>

            <p className="mt-1.5 text-sm text-muted-foreground">
              Contributions actually received from investors.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card shadow-sm">
          <CardContent className="p-6">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Total allocated
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-[-0.02em]">
              ৳{totalAllocated.toLocaleString()}
            </p>

            <p className="mt-1.5 text-sm text-muted-foreground">
              Capital currently assigned to projects.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card shadow-sm">
          <CardContent className="p-6">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Unallocated funds
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-[-0.02em]">
              ৳{unallocatedContributions.toLocaleString()}
            </p>

            <p className="mt-1.5 text-sm text-muted-foreground">
              Raised capital not yet assigned to a project.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/70 bg-card shadow-sm">
          <CardContent className="p-5">
            <Users className="size-5 text-primary" />

            <p className="mt-4 text-xs text-muted-foreground">
              Active investors
            </p>

            <p className="mt-1 text-2xl font-semibold">{activeInvestors}</p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card shadow-sm">
          <CardContent className="p-5">
            <BriefcaseBusiness className="size-5 text-primary" />

            <p className="mt-4 text-xs text-muted-foreground">
              Total investments
            </p>

            <p className="mt-1 text-2xl font-semibold">{totalInvestments}</p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card shadow-sm">
          <CardContent className="p-5">
            <BriefcaseBusiness className="size-5 text-primary" />

            <p className="mt-4 text-xs text-muted-foreground">
              Active investments
            </p>

            <p className="mt-1 text-2xl font-semibold">{activeInvestments}</p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card shadow-sm">
          <CardContent className="p-5">
            <FolderKanban className="size-5 text-primary" />

            <p className="mt-4 text-xs text-muted-foreground">
              Projects funded
            </p>

            <p className="mt-1 text-2xl font-semibold">{projectsFunded}</p>
          </CardContent>
        </Card>
      </section>
      <section className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.02em]">
              Investment Opportunities
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Projects and activities currently available for investor
              participation.
            </p>
          </div>

          {canEdit && (
            <Button
              type="button"
              onClick={() => {
                setOpportunityError("");
                setEditingOpportunity(null);
                setOpportunityForm(getEmptyOpportunityForm());
                setOpportunityDialogOpen(true);
              }}
            >
              <Plus className="size-4" />
              New opportunity
            </Button>
          )}
        </div>

        {opportunities.length === 0 ? (
          <Card className="border-border/70 bg-card shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                No investment opportunities have been created yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {opportunities.map((opportunity) => {
              const target = Number(opportunity.target_amount || 0);
              const committed = Number(opportunity.total_committed || 0);
              const contributed = Number(opportunity.total_contributed || 0);
              const minimum = Number(opportunity.minimum_amount || 0);

              const contributionProgress =
                target > 0 ? Math.min((contributed / target) * 100, 100) : 0;

              return (
                <Card
                  key={opportunity.opportunity_id}
                  className="border-border/70 bg-card shadow-sm"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-lg font-semibold tracking-[-0.02em]">
                          {opportunity.title}
                        </p>

                        {opportunity.description && (
                          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                            {opportunity.description}
                          </p>
                        )}
                      </div>

                      <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-xs font-medium capitalize">
                        {opportunity.status}
                      </span>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Target</p>
                        <p className="mt-1 text-sm font-semibold">
                          ৳{target.toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Committed
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          ৳{committed.toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">Raised</p>
                        <p className="mt-1 text-sm font-semibold text-primary">
                          ৳{contributed.toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">Minimum</p>
                        <p className="mt-1 text-sm font-semibold">
                          {minimum > 0 ? `৳${minimum.toLocaleString()}` : "—"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Funding progress
                        </span>

                        <span className="font-medium">
                          {Math.round(contributionProgress)}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{
                            width: `${contributionProgress}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {opportunity.investment_count} investment
                          {opportunity.investment_count === 1 ? "" : "s"}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground capitalize">
                          {opportunity.visibility}
                        </p>
                      </div>

                      {canEdit && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setOpportunityError("");
                            setEditingOpportunity(opportunity);

                            setOpportunityForm({
                              title: opportunity.title ?? "",
                              description: opportunity.description ?? "",
                              projectId: opportunity.project_id ?? "",
                              speciesConfigId:
                                opportunity.species_config_id ?? "",
                              targetAmount: opportunity.target_amount ?? "",
                              minimumAmount: opportunity.minimum_amount ?? "",
                              openedAt: formatDateForInput(
                                opportunity.opened_at,
                              ),
                              closesAt: formatDateForInput(
                                opportunity.closes_at,
                              ),
                              status: opportunity.status ?? "draft",
                              visibility: opportunity.visibility ?? "private",
                            });

                            setOpportunityDialogOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
      {canEdit && (
        <Dialog
          open={opportunityDialogOpen}
          onOpenChange={(open) => {
            setOpportunityDialogOpen(open);

            if (!open) {
              setOpportunityError("");
              setEditingOpportunity(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-3xl p-7 sm:p-8">
            <DialogHeader>
              <DialogTitle>
                {editingOpportunity
                  ? "Edit investment opportunity"
                  : "Create investment opportunity"}
              </DialogTitle>

              <DialogDescription>
                {editingOpportunity
                  ? "Update the opportunity details without changing its investment history."
                  : "Define a project or activity that can be offered to investors."}
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={
                editingOpportunity
                  ? handleUpdateOpportunity
                  : handleCreateOpportunity
              }
              className="space-y-8"
            >
              {opportunityError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
                  <p className="text-sm text-destructive">{opportunityError}</p>
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2.5">
                  <label
                    htmlFor="opportunity-title"
                    className="text-sm font-medium"
                  >
                    Opportunity title
                  </label>

                  <Input
                    id="opportunity-title"
                    placeholder="e.g. Quail Farm Expansion"
                    value={opportunityForm.title}
                    onChange={(e) =>
                      setOpportunityForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <label
                    htmlFor="opportunity-target"
                    className="text-sm font-medium"
                  >
                    Target amount
                  </label>

                  <Input
                    id="opportunity-target"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="e.g. 50000"
                    value={opportunityForm.targetAmount}
                    onChange={(e) =>
                      setOpportunityForm((prev) => ({
                        ...prev,
                        targetAmount: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <label
                    htmlFor="opportunity-minimum"
                    className="text-sm font-medium"
                  >
                    Minimum investment
                  </label>

                  <Input
                    id="opportunity-minimum"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="e.g. 20000"
                    value={opportunityForm.minimumAmount}
                    onChange={(e) =>
                      setOpportunityForm((prev) => ({
                        ...prev,
                        minimumAmount: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2.5">
                  <label
                    htmlFor="opportunity-project"
                    className="text-sm font-medium"
                  >
                    Linked project
                  </label>

                  <select
                    id="opportunity-project"
                    value={opportunityForm.projectId}
                    onChange={(e) =>
                      setOpportunityForm((prev) => ({
                        ...prev,
                        projectId: e.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="">No project linked</option>

                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                        {project.status === "completed" ? " (Completed)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2.5">
                  <label
                    htmlFor="opportunity-species"
                    className="text-sm font-medium"
                  >
                    Species / activity
                  </label>

                  <select
                    id="opportunity-species"
                    value={opportunityForm.speciesConfigId}
                    onChange={(e) =>
                      setOpportunityForm((prev) => ({
                        ...prev,
                        speciesConfigId: e.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="">All species / activity</option>

                    {species.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                        {item.category ? ` · ${item.category}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2.5">
                  <label
                    htmlFor="opportunity-opened"
                    className="text-sm font-medium"
                  >
                    Opening date
                  </label>

                  <Input
                    id="opportunity-opened"
                    type="date"
                    value={opportunityForm.openedAt}
                    onChange={(e) =>
                      setOpportunityForm((prev) => ({
                        ...prev,
                        openedAt: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2.5">
                  <label
                    htmlFor="opportunity-closes"
                    className="text-sm font-medium"
                  >
                    Closing date
                  </label>

                  <Input
                    id="opportunity-closes"
                    type="date"
                    value={opportunityForm.closesAt}
                    onChange={(e) =>
                      setOpportunityForm((prev) => ({
                        ...prev,
                        closesAt: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2.5">
                  <label
                    htmlFor="opportunity-status"
                    className="text-sm font-medium"
                  >
                    Status
                  </label>

                  <select
                    id="opportunity-status"
                    value={opportunityForm.status}
                    onChange={(e) =>
                      setOpportunityForm((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {getOpportunityStatusOptions(
                      editingOpportunity?.status,
                      Boolean(editingOpportunity),
                    ).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2.5">
                  <label
                    htmlFor="opportunity-visibility"
                    className="text-sm font-medium"
                  >
                    Visibility
                  </label>

                  <select
                    id="opportunity-visibility"
                    value={opportunityForm.visibility}
                    onChange={(e) =>
                      setOpportunityForm((prev) => ({
                        ...prev,
                        visibility: e.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="private">Private</option>
                    <option value="investors">Investors</option>
                    <option value="public">Public</option>
                  </select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label
                    htmlFor="opportunity-description"
                    className="text-sm font-medium"
                  >
                    Description
                  </label>

                  <textarea
                    id="opportunity-description"
                    placeholder="Describe the project, investment purpose, expected use of funds, etc."
                    value={opportunityForm.description}
                    onChange={(e) =>
                      setOpportunityForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={4}
                    className="min-h-[100px] w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-border/60 pt-5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpportunityDialogOpen(false)}
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={savingOpportunity}>
                  {savingOpportunity
                    ? editingOpportunity
                      ? "Saving…"
                      : "Creating…"
                    : editingOpportunity
                      ? "Save changes"
                      : "Create opportunity"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {canEdit && (
        <Dialog
          open={investmentDialogOpen}
          onOpenChange={(open) => {
            setInvestmentDialogOpen(open);

            if (!open) {
              setInvestmentError("");
            }
          }}
        >
          <DialogContent className="sm:max-w-3xl p-7 sm:p-8">
            <DialogHeader>
              <DialogTitle>Create investment</DialogTitle>

              <DialogDescription>
                Record an investor's commitment. Actual contributions and
                project allocations are recorded separately.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateInvestment} className="space-y-8">
              {investmentError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
                  <p className="text-sm text-destructive">{investmentError}</p>
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2.5">
                  <label
                    htmlFor="investment-investor"
                    className="text-sm font-medium"
                  >
                    Investor
                  </label>

                  <select
                    id="investment-investor"
                    value={investmentForm.investorId}
                    onChange={(e) =>
                      setInvestmentForm((prev) => ({
                        ...prev,
                        investorId: e.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    required
                  >
                    <option value="">Select investor</option>

                    {investors
                      .filter((investor) => investor.status === "active")
                      .map((investor) => (
                        <option key={investor.id} value={investor.id}>
                          {investor.name}
                          {investor.email ? ` · ${investor.email}` : ""}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-2.5">
                  <label
                    htmlFor="investment-opportunity"
                    className="text-sm font-medium"
                  >
                    Investment opportunity
                  </label>

                  <select
                    id="investment-opportunity"
                    value={investmentForm.opportunityId}
                    onChange={(e) =>
                      setInvestmentForm((prev) => ({
                        ...prev,
                        opportunityId: e.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="">Direct investment</option>

                    {opportunities
                      .filter((opportunity) => opportunity.status === "open")
                      .map((opportunity) => (
                        <option
                          key={opportunity.opportunity_id}
                          value={opportunity.opportunity_id}
                        >
                          {opportunity.title}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-2.5">
                  <label
                    htmlFor="investment-committed"
                    className="text-sm font-medium"
                  >
                    Committed amount
                  </label>

                  <Input
                    id="investment-committed"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="e.g. 25000"
                    value={investmentForm.committedAmount}
                    onChange={(e) =>
                      setInvestmentForm((prev) => ({
                        ...prev,
                        committedAmount: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <label
                    htmlFor="investment-date"
                    className="text-sm font-medium"
                  >
                    Investment date
                  </label>

                  <Input
                    id="investment-date"
                    type="date"
                    value={investmentForm.investedAt}
                    onChange={(e) =>
                      setInvestmentForm((prev) => ({
                        ...prev,
                        investedAt: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2.5">
                  <label
                    htmlFor="investment-status"
                    className="text-sm font-medium"
                  >
                    Status
                  </label>

                  <select
                    id="investment-status"
                    value={investmentForm.status}
                    onChange={(e) =>
                      setInvestmentForm((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                <div className="space-y-2.5 sm:col-span-2">
                  <label
                    htmlFor="investment-notes"
                    className="text-sm font-medium"
                  >
                    Notes
                  </label>

                  <textarea
                    id="investment-notes"
                    placeholder="Optional notes about the investment commitment."
                    value={investmentForm.notes}
                    onChange={(e) =>
                      setInvestmentForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    rows={4}
                    className="min-h-[100px] w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-border/60 pt-5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setInvestmentDialogOpen(false)}
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={savingInvestment}>
                  {savingInvestment ? "Creating…" : "Create investment"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      <section className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.02em]">
              Investments
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Track investor commitments, received capital, and project
              allocations.
            </p>
          </div>

          {canEdit && (
            <Button
              type="button"
              onClick={() => {
                setInvestmentError("");
                setInvestmentForm(getEmptyInvestmentForm());
                setInvestmentDialogOpen(true);
              }}
            >
              <Plus className="size-4" />
              New investment
            </Button>
          )}
        </div>

        {investments.length === 0 ? (
          <Card className="border-border/70 bg-card shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                No investments have been recorded yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden border-border/70 bg-card shadow-sm">
            <CardContent className="p-0">
              <div className="divide-y divide-border/60">
                {investments.map((investment) => {
                  const committed = Number(investment.committed_amount || 0);

                  const contributed = Number(
                    investment.contributed_amount || 0,
                  );

                  const allocated = Number(investment.allocated_amount || 0);

                  const unallocated = Math.max(contributed - allocated, 0);

                  return (
                    <div
                      key={`${investment.investment_id}-${investment.allocation_id || "unallocated"}`}
                      className="flex flex-col gap-5 p-5 transition-colors hover:bg-muted/30 lg:flex-row lg:items-start lg:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">
                            {investment.investor_name}
                          </p>

                          <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium capitalize">
                            {investment.investment_status}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {investment.opportunity_title || "Direct investment"}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {investment.project_name || "No project allocated"}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4 lg:min-w-[560px]">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Committed
                          </p>

                          <p className="mt-1 text-sm font-semibold">
                            ৳{committed.toLocaleString()}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">
                            Contributed
                          </p>

                          <p className="mt-1 text-sm font-semibold text-primary">
                            ৳{contributed.toLocaleString()}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">
                            Allocated
                          </p>

                          <p className="mt-1 text-sm font-semibold">
                            ৳{allocated.toLocaleString()}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">
                            Unallocated
                          </p>

                          <p className="mt-1 text-sm font-semibold">
                            ৳{unallocated.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

export default Investment;
