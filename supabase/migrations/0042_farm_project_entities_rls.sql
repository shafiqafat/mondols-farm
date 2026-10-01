alter table public.farm_project_entities enable row level security;

create policy "farm_project_entities_select"
on public.farm_project_entities
for select
to authenticated
using (public.farm_can_read());

create policy "farm_project_entities_insert"
on public.farm_project_entities
for insert
to authenticated
with check (public.farm_can_write());

create policy "farm_project_entities_update"
on public.farm_project_entities
for update
to authenticated
using (public.farm_can_write())
with check (public.farm_can_write());

create policy "farm_project_entities_delete"
on public.farm_project_entities
for delete
to authenticated
using (public.farm_can_write());