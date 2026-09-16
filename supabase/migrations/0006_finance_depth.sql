-- Mondol's Farm OS — Finance depth (Slice 4)
-- Lets a farm_entity be assigned to a farm_project, so a project's P&L can
-- pull real yield (from that entity's harvest events) alongside its costs,
-- giving an actual cost/kg rather than just a cash total.

alter table farm_entities
  add column if not exists project_id uuid references farm_projects(id);
