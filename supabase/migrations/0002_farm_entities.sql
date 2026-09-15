insert into farm_entities (species_config_id, label, quantity, acquired_at, location, status, notes)
values
  (
    (select id from species_config where name = 'Quail'),
    'Quail flock (initial batch)',
    100,
    current_date,
    'Main coop',
    'active',
    'Female layers — initial farm experiment batch'
  ),
  (
    (select id from species_config where name = 'Deshi Chicken'),
    'Deshi chickens',
    9,
    current_date,
    'Free-range yard',
    'active',
    'Brief said 8–10 — set to 9, edit to your exact count'
  ),
  (
    (select id from species_config where name = 'Black Bengal Goat'),
    'Black Bengal doe',
    1,
    current_date,
    'Goat shed',
    'active',
    'Female'
  ),
  (
    (select id from species_config where name = 'Napier'),
    'Napier fodder plot',
    2,
    current_date,
    'Field A',
    'active',
    'Quantity is area in decimal, per species space_unit'
  ),
  (
    (select id from species_config where name = 'Mustard'),
    'Mustard plot',
    5,
    current_date,
    'Field B',
    'active',
    'Quantity is area in decimal, per species space_unit'
  );