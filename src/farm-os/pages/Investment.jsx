import { useEffect, useState } from "react";
import {
  CircleDollarSign,
  Users,
  BriefcaseBusiness,
  FolderKanban,
} from "lucide-react";


import InvestmentList from "../components/investment/InvestmentList";
import InvestmentDialogs from "../components/investment/InvestmentDialogs";
import InvestorManagement from "../components/investment/InvestorManagement";
import InvestorPortfolio from "../components/investment/InvestorPortfolio";
import InvestmentOpportunities from "../components/investment/InvestmentOpportunities";
import InvestmentDetail from "../components/investment/InvestmentDetail";

import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import { canWrite } from "../lib/permissions";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

function getEmptyContributionForm() {
  return {
    investmentId: "",
    amount: "",
    occurredAt: "",
    notes: "",
  };
}

function getEmptyAllocationForm() {
  return {
    investmentId: "",
    scopeType: "full_project",
    projectId: "",
    speciesConfigId: "",
    amountAllocated: "",
    participationPct: "",
  };
}

function getEmptyInvestorForm() {
  return {
    name: "",
    email: "",
    phone: "",
    address: "",
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
  const [investmentDetailOpen, setInvestmentDetailOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [savingInvestment, setSavingInvestment] = useState(false);
  const [investmentError, setInvestmentError] = useState("");

  const [investmentForm, setInvestmentForm] = useState(
    getEmptyInvestmentForm(),
  );

  const [contributionDialogOpen, setContributionDialogOpen] = useState(false);
  const [savingContribution, setSavingContribution] = useState(false);
  const [contributionError, setContributionError] = useState("");

  const [contributionForm, setContributionForm] = useState({
    investmentId: "",
    amount: "",
    occurredAt: "",
    notes: "",
  });

  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);
  const [savingAllocation, setSavingAllocation] = useState(false);
  const [allocationError, setAllocationError] = useState("");

  const [allocationForm, setAllocationForm] = useState({
    investmentId: "",
    scopeType: "full_project",
    projectId: "",
    speciesConfigId: "",
    amountAllocated: "",
    participationPct: "",
  });

  const [investorDialogOpen, setInvestorDialogOpen] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState(null);
  const [savingInvestor, setSavingInvestor] = useState(false);
  const [investorError, setInvestorError] = useState("");
  const [investorPortfolioOpen, setInvestorPortfolioOpen] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState(null);

  const [investorForm, setInvestorForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    status: "active",
    notes: "",
  });

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
        .select("id, name, email, phone, address, status, notes")
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

  async function handleCreateContribution(e) {
    e.preventDefault();

    setContributionError("");

    const investmentId = contributionForm.investmentId;
    const amount = Number(contributionForm.amount);

    if (!investmentId) {
      setContributionError("Select an investment.");
      return;
    }

    if (!amount || amount <= 0) {
      setContributionError("Enter a valid contribution amount.");
      return;
    }

    setSavingContribution(true);

    const { error } = await supabase.rpc(
      "record_investment_finance_transaction",
      {
        p_investment_id: investmentId,
        p_type: "contribution",
        p_amount: amount,
        p_occurred_at:
          contributionForm.occurredAt || new Date().toISOString().slice(0, 10),
        p_notes: contributionForm.notes.trim() || null,
      },
    );

    setSavingContribution(false);

    if (error) {
      setContributionError(error.message);
      return;
    }

    setContributionForm(getEmptyContributionForm());
    setContributionDialogOpen(false);

    await loadInvestmentOverview();
  }

  async function handleCreateAllocation(e) {
    e.preventDefault();

    setAllocationError("");

    const investmentId = allocationForm.investmentId;
    const scopeType = allocationForm.scopeType;
    const projectId = allocationForm.projectId;
    const speciesConfigId = allocationForm.speciesConfigId || null;
    const amountAllocated = Number(allocationForm.amountAllocated);
    const participationPct = allocationForm.participationPct
      ? Number(allocationForm.participationPct)
      : null;

    if (!investmentId) {
      setAllocationError("Select an investment.");
      return;
    }

    if (!projectId) {
      setAllocationError("Select a project.");
      return;
    }

    if (!amountAllocated || amountAllocated <= 0) {
      setAllocationError("Enter a valid allocation amount.");
      return;
    }

    if (scopeType === "species_activity" && !speciesConfigId) {
      setAllocationError("Select a species or activity.");
      return;
    }

    if (
      participationPct !== null &&
      (participationPct < 0 || participationPct > 100)
    ) {
      setAllocationError("Participation must be between 0 and 100.");
      return;
    }

    setSavingAllocation(true);

    const { error } = await supabase.from("investment_allocations").insert({
      investment_id: investmentId,
      scope_type: scopeType,
      project_id: projectId,
      species_config_id: scopeType === "full_project" ? null : speciesConfigId,
      amount_allocated: amountAllocated,
      participation_pct: participationPct,
    });

    setSavingAllocation(false);

    if (error) {
      setAllocationError(error.message);
      return;
    }

    setAllocationForm(getEmptyAllocationForm());
    setAllocationDialogOpen(false);

    await loadInvestmentOverview();
  }

  async function handleCreateInvestor(e) {
    e.preventDefault();

    setInvestorError("");

    const name = investorForm.name.trim();

    if (!name) {
      setInvestorError("Enter the investor's name.");
      return;
    }

    setSavingInvestor(true);

    const { error } = await supabase.from("investors").insert({
      name,
      email: investorForm.email.trim() || null,
      phone: investorForm.phone.trim() || null,
      address: investorForm.address.trim() || null,
      status: investorForm.status,
      notes: investorForm.notes.trim() || null,
    });

    setSavingInvestor(false);

    if (error) {
      setInvestorError(error.message);
      return;
    }

    setInvestorForm(getEmptyInvestorForm());
    setInvestorDialogOpen(false);

    await loadInvestmentOverview();
  }

  async function handleUpdateInvestor(e) {
    e.preventDefault();

    if (!editingInvestor) return;

    setInvestorError("");

    const name = investorForm.name.trim();

    if (!name) {
      setInvestorError("Enter the investor's name.");
      return;
    }

    setSavingInvestor(true);

    const { error } = await supabase
      .from("investors")
      .update({
        name,
        email: investorForm.email.trim() || null,
        phone: investorForm.phone.trim() || null,
        address: investorForm.address.trim() || null,
        status: investorForm.status,
        notes: investorForm.notes.trim() || null,
      })
      .eq("id", editingInvestor.id);

    setSavingInvestor(false);

    if (error) {
      setInvestorError(error.message);
      return;
    }

    setEditingInvestor(null);
    setInvestorDialogOpen(false);

    await loadInvestmentOverview();
  }

  function handleViewInvestorPortfolio(investor) {
    setSelectedInvestor(investor);
    setInvestorPortfolioOpen(true);
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

  function handleViewInvestment(investment) {
    const investmentRows = investments.filter(
      (item) => item.investment_id === investment.investment_id,
    );

    if (investmentRows.length === 0) {
      setSelectedInvestment(investment);
      setInvestmentDetailOpen(true);
      return;
    }

    const firstRow = investmentRows[0];

    const allocations = investmentRows
      .filter((item) => item.allocation_id)
      .map((item) => ({
        allocationId: item.allocation_id,
        scopeType: item.scope_type,
        projectId: item.project_id,
        projectName: item.project_name,
        speciesConfigId: item.species_config_id,
        speciesName: item.species_name,
        amountAllocated: Number(item.amount_allocated || 0),
        participationPct: item.participation_pct,
      }));

    const allocatedAmount = allocations.reduce(
      (sum, allocation) => sum + Number(allocation.amountAllocated || 0),
      0,
    );

    const contributedAmount = Number(firstRow.contributed_amount || 0);

    setSelectedInvestment({
      ...firstRow,
      contributed_amount: contributedAmount,
      allocated_amount: allocatedAmount,
      allocations,
    });

    setInvestmentDetailOpen(true);
  }

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
      <InvestorManagement
        investors={investors}
        canEdit={canEdit}
        onViewPortfolio={handleViewInvestorPortfolio}
        investorDialogOpen={investorDialogOpen}
        setInvestorDialogOpen={setInvestorDialogOpen}
        editingInvestor={editingInvestor}
        setEditingInvestor={setEditingInvestor}
        investorForm={investorForm}
        setInvestorForm={setInvestorForm}
        investorError={investorError}
        setInvestorError={setInvestorError}
        savingInvestor={savingInvestor}
        handleCreateInvestor={handleCreateInvestor}
        handleUpdateInvestor={handleUpdateInvestor}
        getEmptyInvestorForm={getEmptyInvestorForm}
      />

      <InvestorPortfolio
        investor={selectedInvestor}
        portfolio={investments}
        open={investorPortfolioOpen}
        onOpenChange={(open) => {
          setInvestorPortfolioOpen(open);

          if (!open) {
            setSelectedInvestor(null);
          }
        }}
        onViewInvestment={handleViewInvestment}
      />

      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.02em]">
            Investment Operations
          </h2>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Record investor commitments, incoming contributions, and project
            allocations.
          </p>
        </div>

        {canEdit && (
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => {
                setInvestmentError("");
                setInvestmentForm(getEmptyInvestmentForm());
                setInvestmentDialogOpen(true);
              }}
            >
              Create investment
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setContributionError("");
                setContributionForm(getEmptyContributionForm());
                setContributionDialogOpen(true);
              }}
            >
              Record contribution
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAllocationError("");
                setAllocationForm(getEmptyAllocationForm());
                setAllocationDialogOpen(true);
              }}
            >
              Record allocation
            </Button>
          </div>
        )}
      </section>

      <InvestmentOpportunities
        opportunities={opportunities}
        projects={projects}
        species={species}
        canEdit={canEdit}
        opportunityDialogOpen={opportunityDialogOpen}
        setOpportunityDialogOpen={setOpportunityDialogOpen}
        editingOpportunity={editingOpportunity}
        setEditingOpportunity={setEditingOpportunity}
        opportunityForm={opportunityForm}
        setOpportunityForm={setOpportunityForm}
        opportunityError={opportunityError}
        setOpportunityError={setOpportunityError}
        savingOpportunity={savingOpportunity}
        handleCreateOpportunity={handleCreateOpportunity}
        handleUpdateOpportunity={handleUpdateOpportunity}
        formatDateForInput={formatDateForInput}
        getEmptyOpportunityForm={getEmptyOpportunityForm}
        getOpportunityStatusOptions={getOpportunityStatusOptions}
      />

      <InvestmentDialogs
        canEdit={canEdit}
        investmentDialogOpen={investmentDialogOpen}
        setInvestmentDialogOpen={setInvestmentDialogOpen}
        investmentError={investmentError}
        investmentForm={investmentForm}
        setInvestmentForm={setInvestmentForm}
        savingInvestment={savingInvestment}
        handleCreateInvestment={handleCreateInvestment}
        contributionDialogOpen={contributionDialogOpen}
        setContributionDialogOpen={setContributionDialogOpen}
        contributionError={contributionError}
        contributionForm={contributionForm}
        setContributionForm={setContributionForm}
        savingContribution={savingContribution}
        handleCreateContribution={handleCreateContribution}
        allocationDialogOpen={allocationDialogOpen}
        setAllocationDialogOpen={setAllocationDialogOpen}
        allocationError={allocationError}
        allocationForm={allocationForm}
        setAllocationForm={setAllocationForm}
        savingAllocation={savingAllocation}
        handleCreateAllocation={handleCreateAllocation}
        investors={investors}
        opportunities={opportunities}
        investments={investments}
        projects={projects}
        species={species}
      />

      <InvestmentList
        investments={investments}
        canEdit={canEdit}
        onNewInvestment={() => {
          setInvestmentError("");
          setInvestmentForm(getEmptyInvestmentForm());
          setInvestmentDialogOpen(true);
        }}
        onViewInvestment={handleViewInvestment}
      />

      <InvestmentDetail
        investment={selectedInvestment}
        open={investmentDetailOpen}
        onOpenChange={setInvestmentDetailOpen}
      />
    </div>
  );
}

export default Investment;
