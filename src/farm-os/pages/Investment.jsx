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

function getEmptyMoneyMovementForm() {
  return {
    investmentId: "",
    type: "contribution",
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
  const [projectFunding, setProjectFunding] = useState([]);

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

  const [moneyMovementDialogOpen, setMoneyMovementDialogOpen] = useState(false);
  const [savingMoneyMovement, setSavingMoneyMovement] = useState(false);
  const [moneyMovementError, setMoneyMovementError] = useState("");

  const [moneyMovementForm, setMoneyMovementForm] = useState(
    getEmptyMoneyMovementForm(),
  );

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
      projectFundingRes,
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
      supabase
        .from("investment_project_overview")
        .select("*")
        .order("project_name"),
    ]);

    const error =
      overviewRes.error ||
      opportunitiesRes.error ||
      projectsRes.error ||
      speciesRes.error ||
      investorsRes.error ||
      investmentsRes.error ||
      projectFundingRes.error;

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
    setProjectFunding(projectFundingRes.data ?? []);
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

    const roiDurationMonths = opportunityForm.roiDurationMonths
      ? Number(opportunityForm.roiDurationMonths)
      : null;

    const roiMinPercent = opportunityForm.roiMinPercent
      ? Number(opportunityForm.roiMinPercent)
      : null;

    const roiMaxPercent = opportunityForm.roiMaxPercent
      ? Number(opportunityForm.roiMaxPercent)
      : null;

    if (
      roiDurationMonths !== null &&
      (!Number.isInteger(roiDurationMonths) || roiDurationMonths <= 0)
    ) {
      setOpportunityError(
        "Project duration must be a positive whole number of months.",
      );
      return;
    }

    if (roiMinPercent !== null && (roiMinPercent < 0 || roiMinPercent > 20)) {
      setOpportunityError("Base ROI minimum must be between 0% and 20%.");
      return;
    }

    if (roiMaxPercent !== null && (roiMaxPercent < 0 || roiMaxPercent > 20)) {
      setOpportunityError("Base ROI maximum must be between 0% and 20%.");
      return;
    }

    if (
      roiMinPercent !== null &&
      roiMaxPercent !== null &&
      roiMaxPercent < roiMinPercent
    ) {
      setOpportunityError("Base ROI maximum cannot be lower than the minimum.");
      return;
    }  

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
      roi_duration_months: roiDurationMonths,
      roi_min_percent: roiMinPercent,
      roi_max_percent: roiMaxPercent,
      roi_max_percent_cap: 20,
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

      const roiDurationMonths = opportunityForm.roiDurationMonths
        ? Number(opportunityForm.roiDurationMonths)
        : null;

      const roiMinPercent = opportunityForm.roiMinPercent
        ? Number(opportunityForm.roiMinPercent)
        : null;

      const roiMaxPercent = opportunityForm.roiMaxPercent
        ? Number(opportunityForm.roiMaxPercent)
        : null;

        if (
          roiDurationMonths !== null &&
          (!Number.isInteger(roiDurationMonths) || roiDurationMonths <= 0)
        ) {
          setOpportunityError(
            "Project duration must be a positive whole number of months.",
          );
          return;
        }

        if (
          roiMinPercent !== null &&
          (roiMinPercent < 0 || roiMinPercent > 20)
        ) {
          setOpportunityError("Base ROI minimum must be between 0% and 20%.");
          return;
        }

        if (
          roiMaxPercent !== null &&
          (roiMaxPercent < 0 || roiMaxPercent > 20)
        ) {
          setOpportunityError("Base ROI maximum must be between 0% and 20%.");
          return;
        }

        if (
          roiMinPercent !== null &&
          roiMaxPercent !== null &&
          roiMaxPercent < roiMinPercent
        ) {
          setOpportunityError(
            "Base ROI maximum cannot be lower than the minimum.",
          );
          return;
        }

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

const opportunityId =
  editingOpportunity.opportunity_id ?? editingOpportunity.id;

if (!opportunityId) {
  setOpportunityError("Unable to identify this investment opportunity.");
  setSavingOpportunity(false);
  return;
}

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
    roi_duration_months: roiDurationMonths,
    roi_min_percent: roiMinPercent,
    roi_max_percent: roiMaxPercent,
    roi_max_percent_cap: 20,
  })
  .eq("id", opportunityId);

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

  async function handleCreateMoneyMovement(e) {
    e.preventDefault();

    setMoneyMovementError("");

    const investmentId = moneyMovementForm.investmentId;
    const type = moneyMovementForm.type;
    const amount = Number(moneyMovementForm.amount);

    if (!investmentId) {
      setMoneyMovementError("Select an investment.");
      return;
    }

    if (!["contribution", "distribution", "refund"].includes(type)) {
      setMoneyMovementError("Select a valid money movement type.");
      return;
    }

    if (!amount || amount <= 0) {
      setMoneyMovementError("Enter a valid amount.");
      return;
    }

    setSavingMoneyMovement(true);

    const { error } = await supabase.rpc(
      "record_investment_finance_transaction",
      {
        p_investment_id: investmentId,
        p_type: type,
        p_amount: amount,
        p_occurred_at:
          moneyMovementForm.occurredAt || new Date().toISOString().slice(0, 10),
        p_notes: moneyMovementForm.notes.trim() || null,
      },
    );

    setSavingMoneyMovement(false);

    if (error) {
      setMoneyMovementError(error.message);
      return;
    }

    setMoneyMovementForm(getEmptyMoneyMovementForm());
    setMoneyMovementDialogOpen(false);

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
    <div className="space-y-10">
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/70 bg-card shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Total committed
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
              ৳{totalCommitted.toLocaleString()}
            </p>

            <p className="mt-1.5 text-sm text-muted-foreground">
              Capital investors have committed to the farm.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Total raised
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-primary">
              ৳{totalContributed.toLocaleString()}
            </p>

            <p className="mt-1.5 text-sm text-muted-foreground">
              Contributions actually received from investors.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card shadow-sm">
          <CardContent className="p-5">
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
          <CardContent className="p-5">
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

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 bg-card/70 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Users className="size-5 text-primary" />
            </div>

            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Active investors</p>

              <p className="mt-1 text-2xl font-semibold">{activeInvestors}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/70 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <BriefcaseBusiness className="size-5 text-primary" />
            </div>

            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Total investments</p>

              <p className="mt-1 text-2xl font-semibold">{totalInvestments}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/70 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <BriefcaseBusiness className="size-5 text-primary" />
            </div>

            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                Active investments
              </p>

              <p className="mt-1 text-2xl font-semibold">{activeInvestments}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/70 shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <FolderKanban className="size-5 text-primary" />
            </div>

            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Projects funded</p>

              <p className="mt-1 text-2xl font-semibold">{projectsFunded}</p>
            </div>
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

      <section className="space-y-[20px]">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.02em]">
            Investment Operations
          </h2>

          <p className="mt-[4px] max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage investor commitments, money movements, and project
            allocations.
          </p>
        </div>

        {canEdit && (
          <div className="grid gap-[12px] md:grid-cols-3">
            <Card className="border-border/70 bg-card shadow-sm transition-colors hover:border-primary/30">
              <CardContent className="flex h-full flex-col p-[20px]">
                <div>
                  <p className="text-base font-semibold">Create investment</p>

                  <p className="mt-[6px] text-sm leading-6 text-muted-foreground">
                    Create a new investor commitment and establish their
                    investment position.
                  </p>
                </div>

                <Button
                  type="button"
                  className="mt-[20px] w-full"
                  onClick={() => {
                    setInvestmentError("");
                    setInvestmentForm(getEmptyInvestmentForm());
                    setInvestmentDialogOpen(true);
                  }}
                >
                  Create investment
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card shadow-sm transition-colors hover:border-primary/30">
              <CardContent className="flex h-full flex-col p-[20px]">
                <div>
                  <p className="text-base font-semibold">Money movement</p>

                  <p className="mt-[6px] text-sm leading-6 text-muted-foreground">
                    Record contributions, distributions, or refunds for an
                    existing investment.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="mt-[20px] w-full"
                  onClick={() => {
                    setMoneyMovementError("");
                    setMoneyMovementForm(getEmptyMoneyMovementForm());
                    setMoneyMovementDialogOpen(true);
                  }}
                >
                  Record money movement
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card shadow-sm transition-colors hover:border-primary/30">
              <CardContent className="flex h-full flex-col p-[20px]">
                <div>
                  <p className="text-base font-semibold">Project allocation</p>

                  <p className="mt-[6px] text-sm leading-6 text-muted-foreground">
                    Assign contributed investor capital to one or more farm
                    projects or activities.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="mt-[20px] w-full"
                  onClick={() => {
                    setAllocationError("");
                    setAllocationForm(getEmptyAllocationForm());
                    setAllocationDialogOpen(true);
                  }}
                >
                  Record allocation
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.02em]">
            Project Funding
          </h2>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            See how investor capital is allocated across farm projects.
          </p>
        </div>

        {projectFunding.length === 0 ? (
          <Card className="border-border/70 bg-card shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">
                No project funding has been recorded yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {projectFunding.map((project) => (
              <Card
                key={project.project_id}
                className="border-border/70 bg-card shadow-sm"
              >
                <CardContent className="p-5">
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold tracking-[-0.02em]">
                        {project.project_name}
                      </h3>

                      <p className="mt-1 text-sm text-muted-foreground capitalize">
                        {project.project_type || "Project"}
                        {" · "}
                        {project.project_status || "Unknown"}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-6 lg:justify-items-end">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">
                          Investors
                        </p>

                        <p className="mt-1.5 text-lg font-semibold">
                          {Number(project.investor_count || 0)}
                        </p>
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">
                          Investments
                        </p>

                        <p className="mt-1.5 text-lg font-semibold">
                          {Number(project.investment_count || 0)}
                        </p>
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">
                          Allocated
                        </p>

                        <p className="mt-1.5 text-lg font-semibold text-primary">
                          ৳
                          {Number(
                            project.total_allocated || 0,
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
        moneyMovementDialogOpen={moneyMovementDialogOpen}
        setMoneyMovementDialogOpen={setMoneyMovementDialogOpen}
        moneyMovementError={moneyMovementError}
        moneyMovementForm={moneyMovementForm}
        setMoneyMovementForm={setMoneyMovementForm}
        savingMoneyMovement={savingMoneyMovement}
        handleCreateMoneyMovement={handleCreateMoneyMovement}
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
