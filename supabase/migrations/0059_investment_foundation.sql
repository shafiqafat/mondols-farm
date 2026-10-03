-- Mondol's Farm OS — Investment Foundation
-- 0059
--
-- Establishes the investment/investor layer without replacing
-- the existing FarmOS financial ledger.
--
-- Core concepts:
--   investors                → people/entities providing capital
--   investment_opportunities → projects/activities available for funding
--   investments              → investor commitments
--   investment_allocations   → what an investment is attached to
--   investment_transactions  → actual money movements
--
-- finance_transactions remains the farm-wide financial ledger.


-- ---------------------------------------------------------------------
-- 1. investors
-- ---------------------------------------------------------------------

create table if not exists public.investors (
  id uuid primary key default gen_random_uuid(),

  -- Nullable until the investor receives an Investor Portal account.
  user_id uuid unique references auth.users(id) on delete set null,

  name text not null,
  email text,
  phone text,
  address text,

  status text not null default 'active',

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint investors_status_check
    check (status in ('active', 'inactive'))
);


-- ---------------------------------------------------------------------
-- 2. investment_opportunities
--
-- Something the farm offers to potential investors.
-- It may exist before an actual farm_project exists.
-- ---------------------------------------------------------------------

create table if not exists public.investment_opportunities (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  description text,

  -- Optional link to the actual operational project.
  project_id uuid
    references public.farm_projects(id)
    on delete restrict,

  -- Optional activity/species focus.
  species_config_id uuid
    references public.species_config(id)
    on delete restrict,

  target_amount numeric not null,
  minimum_amount numeric,

  opened_at date,
  closes_at date,

  status text not null default 'draft',

  -- Controls whether this opportunity is shown publicly
  -- through the investor-facing experience.
  visibility text not null default 'private',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint investment_opportunities_target_check
    check (target_amount > 0),

  constraint investment_opportunities_minimum_check
    check (
      minimum_amount is null
      or minimum_amount > 0
    ),

  constraint investment_opportunities_minimum_target_check
    check (
      minimum_amount is null
      or minimum_amount <= target_amount
    ),

  constraint investment_opportunities_date_check
    check (
      closes_at is null
      or opened_at is null
      or closes_at >= opened_at
    ),

  constraint investment_opportunities_status_check
    check (
      status in (
        'draft',
        'upcoming',
        'open',
        'fully_funded',
        'closed',
        'cancelled'
      )
    ),

  constraint investment_opportunities_visibility_check
    check (
      visibility in (
        'private',
        'investors',
        'public'
      )
    )
);


-- ---------------------------------------------------------------------
-- 3. investments
--
-- An investor's commitment.
--
-- committed_amount = amount the investor agrees to provide.
-- Actual money received is recorded in investment_transactions.
-- ---------------------------------------------------------------------

create table if not exists public.investments (
  id uuid primary key default gen_random_uuid(),

  investor_id uuid not null
    references public.investors(id)
    on delete restrict,

  opportunity_id uuid
    references public.investment_opportunities(id)
    on delete restrict,

  committed_amount numeric not null,

  invested_at date not null default current_date,

  status text not null default 'active',

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint investments_committed_amount_check
    check (committed_amount > 0),

  constraint investments_status_check
    check (
      status in (
        'active',
        'completed',
        'cancelled',
        'refunded'
      )
    )
);


-- ---------------------------------------------------------------------
-- 4. investment_allocations
--
-- Defines what an investment applies to.
--
-- full_project:
--   project_id required
--   species_config_id must be null
--
-- species_activity:
--   project_id required
--   species_config_id required
--
-- partial:
--   project_id required
--   species_config_id optional
--   participation_pct optional
--
-- amount_allocated represents the committed amount assigned
-- to this allocation.
-- ---------------------------------------------------------------------

create table if not exists public.investment_allocations (
  id uuid primary key default gen_random_uuid(),

  investment_id uuid not null
    references public.investments(id)
    on delete cascade,

  scope_type text not null,

  project_id uuid not null
    references public.farm_projects(id)
    on delete restrict,

  species_config_id uuid
    references public.species_config(id)
    on delete restrict,

  amount_allocated numeric not null,

  participation_pct numeric,

  created_at timestamptz not null default now(),

  constraint investment_allocations_scope_check
    check (
      scope_type in (
        'full_project',
        'species_activity',
        'partial'
      )
    ),

  constraint investment_allocations_amount_check
    check (amount_allocated > 0),

  constraint investment_allocations_participation_check
    check (
      participation_pct is null
      or (
        participation_pct >= 0
        and participation_pct <= 100
      )
    ),

  constraint investment_allocations_scope_requirements_check
    check (
      (
        scope_type = 'full_project'
        and species_config_id is null
      )
      or
      (
        scope_type = 'species_activity'
        and species_config_id is not null
      )
      or
      (
        scope_type = 'partial'
      )
    )
);


-- ---------------------------------------------------------------------
-- 5. investment_transactions
--
-- Actual investor-related money movements.
--
-- contribution  → investor pays into the investment
-- distribution  → money/value distributed back to investor
-- refund        → capital returned
-- adjustment    → administrative correction
--
-- finance_transaction_id optionally connects this movement
-- to the farm-wide financial ledger.
-- ---------------------------------------------------------------------

create table if not exists public.investment_transactions (
  id uuid primary key default gen_random_uuid(),

  investment_id uuid not null
    references public.investments(id)
    on delete restrict,

  type text not null,

  amount numeric not null,

  occurred_at date not null default current_date,

  finance_transaction_id uuid
    references public.finance_transactions(id)
    on delete restrict,

  notes text,

  created_at timestamptz not null default now(),

  constraint investment_transactions_type_check
    check (
      type in (
        'contribution',
        'distribution',
        'refund',
        'adjustment'
      )
    ),

  constraint investment_transactions_amount_check
    check (amount > 0)
);


-- ---------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------

create index if not exists idx_investors_user
  on public.investors(user_id);

create index if not exists idx_investors_status
  on public.investors(status);

create index if not exists idx_investment_opportunities_project
  on public.investment_opportunities(project_id);

create index if not exists idx_investment_opportunities_species
  on public.investment_opportunities(species_config_id);

create index if not exists idx_investment_opportunities_status
  on public.investment_opportunities(status);

create index if not exists idx_investments_investor
  on public.investments(investor_id);

create index if not exists idx_investments_opportunity
  on public.investments(opportunity_id);

create index if not exists idx_investments_status
  on public.investments(status);

create index if not exists idx_investment_allocations_investment
  on public.investment_allocations(investment_id);

create index if not exists idx_investment_allocations_project
  on public.investment_allocations(project_id);

create index if not exists idx_investment_allocations_species
  on public.investment_allocations(species_config_id);

create index if not exists idx_investment_transactions_investment
  on public.investment_transactions(investment_id);

create index if not exists idx_investment_transactions_date
  on public.investment_transactions(occurred_at desc);

create index if not exists idx_investment_transactions_finance
  on public.investment_transactions(finance_transaction_id);


-- ---------------------------------------------------------------------
-- Row Level Security
--
-- Initially this follows the existing single-admin FarmOS model.
-- Investor-specific RLS will be added only after the investor access
-- model is implemented and tested.
-- ---------------------------------------------------------------------

alter table public.investors enable row level security;
alter table public.investment_opportunities enable row level security;
alter table public.investments enable row level security;
alter table public.investment_allocations enable row level security;
alter table public.investment_transactions enable row level security;


create policy "investors_select"
on public.investors
for select
to authenticated
using (public.farm_can_read());

create policy "investors_insert"
on public.investors
for insert
to authenticated
with check (public.farm_can_write());

create policy "investors_update"
on public.investors
for update
to authenticated
using (public.farm_can_write())
with check (public.farm_can_write());


create policy "investment_opportunities_select"
on public.investment_opportunities
for select
to authenticated
using (public.farm_can_read());

create policy "investment_opportunities_insert"
on public.investment_opportunities
for insert
to authenticated
with check (public.farm_can_write());

create policy "investment_opportunities_update"
on public.investment_opportunities
for update
to authenticated
using (public.farm_can_write())
with check (public.farm_can_write());

create policy "investment_opportunities_delete"
on public.investment_opportunities
for delete
to authenticated
using (public.farm_can_write());


create policy "investments_select"
on public.investments
for select
to authenticated
using (public.farm_can_read());

create policy "investments_insert"
on public.investments
for insert
to authenticated
with check (public.farm_can_write());

create policy "investments_update"
on public.investments
for update
to authenticated
using (public.farm_can_write())
with check (public.farm_can_write());


create policy "investment_allocations_select"
on public.investment_allocations
for select
to authenticated
using (public.farm_can_read());

create policy "investment_allocations_insert"
on public.investment_allocations
for insert
to authenticated
with check (public.farm_can_write());

create policy "investment_allocations_update"
on public.investment_allocations
for update
to authenticated
using (public.farm_can_write())
with check (public.farm_can_write());


create policy "investment_transactions_select"
on public.investment_transactions
for select
to authenticated
using (public.farm_can_read());

create policy "investment_transactions_insert"
on public.investment_transactions
for insert
to authenticated
with check (public.farm_can_write());

create policy "investment_transactions_update"
on public.investment_transactions
for update
to authenticated
using (public.farm_can_write())
with check (public.farm_can_write());