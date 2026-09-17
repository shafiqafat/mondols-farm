-- Mondol's Farm OS — Content Journal (Slice 6)
-- Tracks content (photos/videos/notes) tied to farm activity through a
-- lifecycle: idea -> captured -> editing -> published. Optionally linked
-- to an entity or project so a piece of content can be traced back to
-- what it's actually about.

create table if not exists content_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null default 'mixed',   -- 'photo' | 'video' | 'note' | 'mixed'
  stage text not null default 'idea',   -- 'idea' | 'captured' | 'editing' | 'published'
  entity_id uuid references farm_entities(id),
  project_id uuid references farm_projects(id),
  notes text,
  external_url text,                    -- link to the published post, once it exists
  occurred_at date not null default current_date,
  created_at timestamptz not null default now()
);

alter table content_items enable row level security;

create policy "authenticated_full_access_content_items" on content_items
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
