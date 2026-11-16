-- Seed data: destination countries, job categories, notification settings.
-- Descriptions describe areas of candidate interest only. They do not state
-- that vacancies are currently open.

insert into public.countries (name, iso_code, description, sort_order) values
  ('Germany', 'de', 'Register your interest in healthcare, engineering, skilled trades and logistics roles with German employers.', 1),
  ('United Arab Emirates (UAE)', 'ae', 'Register your interest in hospitality, construction, retail, facilities and professional roles across the Emirates.', 2),
  ('Saudi Arabia', 'sa', 'Register your interest in construction, oil and gas, healthcare, and operations and maintenance roles.', 3),
  ('Qatar', 'qa', 'Register your interest in construction, hospitality, facilities management and technical roles.', 4),
  ('Kuwait', 'kw', 'Register your interest in oil and gas, healthcare, driving and technical trade roles.', 5),
  ('Oman', 'om', 'Register your interest in construction, hospitality, logistics and skilled technical roles.', 6),
  ('Bahrain', 'bh', 'Register your interest in hospitality, finance, manufacturing and service-sector roles.', 7),
  ('Other European Countries', 'eu', 'Tell us which other European countries you would consider for skilled and semi-skilled work.', 8),
  ('Other International Destinations', null, 'Open to other markets? Register and tell us where you would like to work.', 9)
on conflict (name) do nothing;

insert into public.job_categories (name, icon, description, sort_order) values
  ('Construction & Civil Engineering', 'hard-hat', 'Civil engineers, site supervisors, masons, carpenters, steel fixers and surveyors.', 1),
  ('Mechanical & Electrical Engineering', 'cog', 'Mechanical and electrical engineers, technicians, HVAC and MEP specialists.', 2),
  ('Healthcare & Nursing', 'stethoscope', 'Registered nurses, caregivers, lab and radiology technicians, allied health staff.', 3),
  ('Hospitality & Hotel Management', 'hotel', 'Front office, housekeeping, guest relations and hotel operations.', 4),
  ('Restaurant & Food Services', 'utensils', 'Chefs, cooks, bakers, baristas, waiters and kitchen stewards.', 5),
  ('Drivers & Transportation', 'truck', 'Light and heavy vehicle drivers, bus drivers and equipment operators.', 6),
  ('Warehouse & Logistics', 'warehouse', 'Storekeepers, pickers and packers, forklift operators and supply chain staff.', 7),
  ('Manufacturing & Production', 'factory', 'Machine operators, production workers, quality control and line supervisors.', 8),
  ('Oil & Gas', 'fuel', 'Riggers, pipe fitters, welders, HSE officers and plant operators.', 9),
  ('IT & Software', 'laptop', 'Developers, network and system administrators, and IT support.', 10),
  ('Sales & Marketing', 'trending-up', 'Sales executives, retail associates, merchandisers and marketing staff.', 11),
  ('Accounting & Finance', 'calculator', 'Accountants, bookkeepers, auditors and finance officers.', 12),
  ('Security Services', 'shield', 'Security guards, supervisors and CCTV operators.', 13),
  ('Skilled & Technical Trades', 'wrench', 'Electricians, plumbers, welders, fabricators, painters and AC technicians.', 14),
  ('General Helpers & Labour', 'users', 'Helpers, cleaners, loaders and general workers.', 15),
  ('Other Professional Categories', 'briefcase', 'Any profession not listed above. Tell us about your field.', 16)
on conflict (name) do nothing;

insert into public.notification_settings (id) values (1) on conflict (id) do nothing;
