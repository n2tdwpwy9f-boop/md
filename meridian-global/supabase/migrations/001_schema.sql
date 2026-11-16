-- =====================================================================
-- International Manpower Recruitment Platform - database schema
-- Run this file first in the Supabase SQL editor, then 002_seed.sql
-- =====================================================================

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;
-- Find pg_trgm whichever schema it is installed in.
set search_path = public, extensions;

-- ---------------------------------------------------------------------
-- Master data
-- ---------------------------------------------------------------------
create table public.countries (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  iso_code text,                       -- ISO 3166-1 alpha-2 (used for the flag), null = globe icon
  description text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.job_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon text not null default 'briefcase',
  description text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Admin users (linked to Supabase Auth)
-- ---------------------------------------------------------------------
create table public.admin_users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'recruiter' check (role in ('super_admin', 'recruiter', 'viewer')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Role of the signed-in user, or null when the caller is not an active admin.
create or replace function public.current_admin_role()
returns text
language sql stable security definer
set search_path = public
as $$
  select role from public.admin_users where id = auth.uid() and is_active
$$;

-- ---------------------------------------------------------------------
-- Candidates
-- ---------------------------------------------------------------------
create sequence public.candidate_code_seq start 1001;

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  candidate_code text not null unique
    default ('CND-' || to_char(now(), 'YY') || '-' || lpad(nextval('public.candidate_code_seq')::text, 6, '0')),

  -- Step 1: personal
  full_name text not null,
  mobile text not null,
  whatsapp text,
  email text not null,
  date_of_birth date,
  gender text,
  nationality text,
  current_country text,
  current_city text,
  address text,

  -- Step 2: education
  highest_qualification text,
  specialization text,
  institution text,
  year_of_passing int,
  certifications text,
  technical_qualifications text,

  -- Step 3: experience
  experience_type text not null default 'fresher' check (experience_type in ('fresher', 'experienced')),
  experience_years numeric(4, 1) not null default 0,
  job_title text,
  previous_company text,
  industry text,
  key_skills text[] not null default '{}',
  languages text[] not null default '{}',
  professional_license text,

  -- Step 4: international preference
  preferred_countries text[] not null default '{}',
  preferred_category text,
  preferred_role text,
  preferred_location text,
  employment_type text,
  expected_salary numeric(12, 2),
  salary_currency text,
  current_salary numeric(12, 2),
  notice_period text,
  willing_to_relocate text,
  passport_status text check (passport_status in ('yes', 'no', 'applied')),
  passport_expiry date,

  -- Step 6: additional
  introduction text,
  abroad_motivation text,
  additional_info text,

  -- Consent record
  consent_accuracy boolean not null default false,
  consent_storage boolean not null default false,
  consent_communication boolean not null default false,
  consent_at timestamptz,

  -- Recruitment
  status text not null default 'new' check (status in (
    'new', 'under_review', 'suitable', 'shortlisted', 'profile_shared',
    'interview_scheduled', 'interview_completed', 'selected', 'documentation',
    'visa_processing', 'deployed', 'rejected', 'on_hold')),
  status_updated_at timestamptz not null default now(),
  source text not null default 'website',
  retention_expires_at timestamptz not null default (now() + interval '24 months'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index candidates_created_idx on public.candidates (created_at desc);
create index candidates_status_idx on public.candidates (status);
create index candidates_category_idx on public.candidates (preferred_category);
create index candidates_qualification_idx on public.candidates (highest_qualification);
create index candidates_experience_idx on public.candidates (experience_years);
create index candidates_retention_idx on public.candidates (retention_expires_at);
create index candidates_countries_idx on public.candidates using gin (preferred_countries);
create index candidates_skills_idx on public.candidates using gin (key_skills);
create index candidates_name_trgm on public.candidates using gin (full_name gin_trgm_ops);
create index candidates_email_trgm on public.candidates using gin (email gin_trgm_ops);
create index candidates_mobile_trgm on public.candidates using gin (mobile gin_trgm_ops);

create table public.candidate_documents (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  doc_type text not null check (doc_type in (
    'resume', 'passport', 'education_certificate', 'experience_certificate', 'professional_license', 'photo')),
  file_name text not null,
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);
create index candidate_documents_candidate_idx on public.candidate_documents (candidate_id);

create table public.recruitment_status_history (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  status text not null,
  note text,
  effective_date date not null default current_date,
  changed_by uuid references public.admin_users (id) on delete set null,
  changed_by_name text,
  created_at timestamptz not null default now()
);
create index status_history_candidate_idx on public.recruitment_status_history (candidate_id, created_at desc);

create table public.recruitment_notes (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  note text not null,
  created_by uuid references public.admin_users (id) on delete set null,
  created_by_name text,
  created_at timestamptz not null default now()
);
create index notes_candidate_idx on public.recruitment_notes (candidate_id, created_at desc);

-- ---------------------------------------------------------------------
-- Employer requirements
-- ---------------------------------------------------------------------
create sequence public.requirement_code_seq start 101;

create table public.employer_requirements (
  id uuid primary key default gen_random_uuid(),
  requirement_code text not null unique
    default ('REQ-' || lpad(nextval('public.requirement_code_seq')::text, 5, '0')),
  employer_name text not null,
  destination_country text not null,
  industry text,
  job_category text not null,
  job_position text not null,
  workers_required int not null default 1 check (workers_required > 0),
  min_qualification text,
  min_experience_years numeric(4, 1) not null default 0,
  required_skills text[] not null default '{}',
  salary_range text,
  employment_type text,
  job_description text,
  benefits text,
  application_deadline date,
  status text not null default 'open' check (status in ('draft', 'open', 'on_hold', 'filled', 'closed')),
  is_published boolean not null default false,   -- true = verified vacancy shown on the public site
  created_by uuid references public.admin_users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index requirements_status_idx on public.employer_requirements (status, created_at desc);

create table public.requirement_shortlists (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid not null references public.employer_requirements (id) on delete cascade,
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  note text,
  added_by uuid references public.admin_users (id) on delete set null,
  added_by_name text,
  created_at timestamptz not null default now(),
  unique (requirement_id, candidate_id)
);
create index shortlists_candidate_idx on public.requirement_shortlists (candidate_id);

-- ---------------------------------------------------------------------
-- Communication log + notification settings
-- ---------------------------------------------------------------------
create table public.communications (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references public.candidates (id) on delete cascade,
  channel text not null check (channel in ('email', 'whatsapp', 'phone', 'system')),
  recipient text,
  subject text,
  body text,
  template text,
  status text not null default 'logged' check (status in ('sent', 'failed', 'logged')),
  error text,
  created_by uuid references public.admin_users (id) on delete set null,
  created_by_name text,
  created_at timestamptz not null default now()
);
create index communications_candidate_idx on public.communications (candidate_id, created_at desc);
create index communications_created_idx on public.communications (created_at desc);

create table public.notification_settings (
  id int primary key default 1 check (id = 1),
  confirm_candidate boolean not null default true,
  notify_admins boolean not null default true,
  admin_emails text[] not null default '{}',
  status_updates boolean not null default true,
  status_update_stages text[] not null default
    '{shortlisted,interview_scheduled,selected,documentation,visa_processing,deployed}',
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger candidates_touch before update on public.candidates
  for each row execute function public.touch_updated_at();
create trigger requirements_touch before update on public.employer_requirements
  for each row execute function public.touch_updated_at();

-- Keep stored names in sync when an admin renames a country or category.
create or replace function public.propagate_country_rename()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.name is distinct from old.name then
    update candidates set preferred_countries = array_replace(preferred_countries, old.name, new.name)
      where preferred_countries @> array[old.name];
    update employer_requirements set destination_country = new.name where destination_country = old.name;
  end if;
  return new;
end $$;
create trigger countries_rename after update on public.countries
  for each row execute function public.propagate_country_rename();

create or replace function public.propagate_category_rename()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.name is distinct from old.name then
    update candidates set preferred_category = new.name where preferred_category = old.name;
    update employer_requirements set job_category = new.name where job_category = old.name;
  end if;
  return new;
end $$;
create trigger categories_rename after update on public.job_categories
  for each row execute function public.propagate_category_rename();

-- ---------------------------------------------------------------------
-- Functions used by the dashboard
-- ---------------------------------------------------------------------
create or replace function public.qualification_rank(q text)
returns int language sql immutable as $$
  select case q
    when 'Below Secondary' then 1
    when 'Secondary (10th)' then 2
    when 'Higher Secondary (12th)' then 3
    when 'ITI / Trade Certificate' then 4
    when 'Diploma' then 5
    when 'Bachelor''s Degree' then 6
    when 'Master''s Degree' then 7
    when 'Doctorate / PhD' then 8
    else 0 end
$$;

create or replace function public.dashboard_stats()
returns json
language sql stable security invoker set search_path = public
as $$
  select json_build_object(
    'total', count(*),
    'new_7d', count(*) filter (where created_at > now() - interval '7 days'),
    'experienced', count(*) filter (where experience_type = 'experienced'),
    'freshers', count(*) filter (where experience_type = 'fresher'),
    'germany', count(*) filter (where preferred_countries @> array['Germany']),
    'uae', count(*) filter (where preferred_countries @> array['United Arab Emirates (UAE)']),
    'other_countries', count(*) filter (where exists (
        select 1 from unnest(preferred_countries) x
        where x not in ('Germany', 'United Arab Emirates (UAE)'))),
    'shortlisted', count(*) filter (where status = 'shortlisted'),
    'processing', count(*) filter (where status in (
        'profile_shared', 'interview_scheduled', 'interview_completed',
        'selected', 'documentation', 'visa_processing')),
    'placed', count(*) filter (where status = 'deployed'),
    'by_status', (select coalesce(json_object_agg(status, n), '{}'::json)
                  from (select status, count(*) n from candidates group by status) s)
  )
  from candidates
$$;

-- Scores candidates against one employer requirement (0-100).
-- Category 30, destination 25, experience 20, qualification 10, skills 15.
create or replace function public.match_candidates(p_requirement uuid)
returns table (
  id uuid, candidate_code text, full_name text, mobile text, email text, nationality text,
  highest_qualification text, experience_years numeric, preferred_category text,
  preferred_countries text[], key_skills text[], status text,
  score int, category_match boolean, country_match boolean, experience_match boolean,
  qualification_match boolean, skills_matched int, skills_total int
)
language sql stable security invoker set search_path = public
as $$
  with r as (
    select * from employer_requirements er where er.id = p_requirement
  ),
  s as (
    select c.*,
      coalesce(c.preferred_category = r.job_category, false) as cat_m,
      coalesce(c.preferred_countries @> array[r.destination_country], false) as country_m,
      (c.experience_years >= coalesce(r.min_experience_years, 0)) as exp_m,
      (qualification_rank(c.highest_qualification) >= qualification_rank(r.min_qualification)) as qual_m,
      (select count(*)::int from unnest(r.required_skills) rs
        where exists (
          select 1 from unnest(c.key_skills) cs
          where lower(cs) like '%' || lower(rs) || '%' or lower(rs) like '%' || lower(cs) || '%')) as sk_m,
      coalesce(array_length(r.required_skills, 1), 0) as sk_t
    from candidates c cross join r
    where c.status not in ('rejected', 'deployed')
  )
  select s.id, s.candidate_code, s.full_name, s.mobile, s.email, s.nationality,
    s.highest_qualification, s.experience_years, s.preferred_category,
    s.preferred_countries, s.key_skills, s.status,
    (case when s.cat_m then 30 else 0 end
      + case when s.country_m then 25 else 0 end
      + case when s.exp_m then 20 else 0 end
      + case when s.qual_m then 10 else 0 end
      + case when s.sk_t > 0 then round(15.0 * s.sk_m / s.sk_t)::int else 15 end) as score,
    s.cat_m, s.country_m, s.exp_m, s.qual_m, s.sk_m, s.sk_t
  from s
  where s.cat_m or s.country_m
  order by 13 desc, s.created_at desc
  limit 300
$$;

-- Public, read-only projection of verified vacancies. Deliberately excludes
-- the employer name and internal fields. Only rows an admin has published.
create view public.published_vacancies as
  select id, requirement_code, destination_country, industry, job_category, job_position,
         workers_required, min_qualification, min_experience_years, employment_type,
         salary_range, benefits, application_deadline, created_at
  from public.employer_requirements
  where is_published and status = 'open'
    and (application_deadline is null or application_deadline >= current_date);

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.countries enable row level security;
alter table public.job_categories enable row level security;
alter table public.admin_users enable row level security;
alter table public.candidates enable row level security;
alter table public.candidate_documents enable row level security;
alter table public.recruitment_status_history enable row level security;
alter table public.recruitment_notes enable row level security;
alter table public.employer_requirements enable row level security;
alter table public.requirement_shortlists enable row level security;
alter table public.communications enable row level security;
alter table public.notification_settings enable row level security;

-- Master data: public can read active rows, staff manage.
create policy "read countries" on public.countries for select to anon, authenticated
  using (is_active or (select public.current_admin_role()) is not null);
create policy "staff manage countries" on public.countries for all to authenticated
  using ((select public.current_admin_role()) in ('super_admin', 'recruiter'))
  with check ((select public.current_admin_role()) in ('super_admin', 'recruiter'));

create policy "read categories" on public.job_categories for select to anon, authenticated
  using (is_active or (select public.current_admin_role()) is not null);
create policy "staff manage categories" on public.job_categories for all to authenticated
  using ((select public.current_admin_role()) in ('super_admin', 'recruiter'))
  with check ((select public.current_admin_role()) in ('super_admin', 'recruiter'));

-- Admin users.
create policy "admins read admins" on public.admin_users for select to authenticated
  using ((select public.current_admin_role()) is not null);
create policy "super admins manage admins" on public.admin_users for all to authenticated
  using ((select public.current_admin_role()) = 'super_admin')
  with check ((select public.current_admin_role()) = 'super_admin');

-- Candidates: no public access at all. Registration goes through the server
-- (service role) only.
create policy "admins read candidates" on public.candidates for select to authenticated
  using ((select public.current_admin_role()) is not null);
create policy "staff insert candidates" on public.candidates for insert to authenticated
  with check ((select public.current_admin_role()) in ('super_admin', 'recruiter'));
create policy "staff update candidates" on public.candidates for update to authenticated
  using ((select public.current_admin_role()) in ('super_admin', 'recruiter'))
  with check ((select public.current_admin_role()) in ('super_admin', 'recruiter'));
create policy "super admins delete candidates" on public.candidates for delete to authenticated
  using ((select public.current_admin_role()) = 'super_admin');

-- Documents: viewers cannot see or download documents.
create policy "staff read documents" on public.candidate_documents for select to authenticated
  using ((select public.current_admin_role()) in ('super_admin', 'recruiter'));
create policy "super admins delete documents" on public.candidate_documents for delete to authenticated
  using ((select public.current_admin_role()) = 'super_admin');

create policy "admins read history" on public.recruitment_status_history for select to authenticated
  using ((select public.current_admin_role()) is not null);
create policy "staff add history" on public.recruitment_status_history for insert to authenticated
  with check ((select public.current_admin_role()) in ('super_admin', 'recruiter'));

create policy "admins read notes" on public.recruitment_notes for select to authenticated
  using ((select public.current_admin_role()) is not null);
create policy "staff add notes" on public.recruitment_notes for insert to authenticated
  with check ((select public.current_admin_role()) in ('super_admin', 'recruiter'));
create policy "delete own notes" on public.recruitment_notes for delete to authenticated
  using ((select public.current_admin_role()) = 'super_admin' or created_by = auth.uid());

create policy "admins read requirements" on public.employer_requirements for select to authenticated
  using ((select public.current_admin_role()) is not null);
create policy "staff manage requirements" on public.employer_requirements for all to authenticated
  using ((select public.current_admin_role()) in ('super_admin', 'recruiter'))
  with check ((select public.current_admin_role()) in ('super_admin', 'recruiter'));

create policy "admins read shortlists" on public.requirement_shortlists for select to authenticated
  using ((select public.current_admin_role()) is not null);
create policy "staff manage shortlists" on public.requirement_shortlists for all to authenticated
  using ((select public.current_admin_role()) in ('super_admin', 'recruiter'))
  with check ((select public.current_admin_role()) in ('super_admin', 'recruiter'));

create policy "admins read communications" on public.communications for select to authenticated
  using ((select public.current_admin_role()) is not null);
create policy "staff log communications" on public.communications for insert to authenticated
  with check ((select public.current_admin_role()) in ('super_admin', 'recruiter'));

create policy "admins read settings" on public.notification_settings for select to authenticated
  using ((select public.current_admin_role()) is not null);
create policy "super admins update settings" on public.notification_settings for update to authenticated
  using ((select public.current_admin_role()) = 'super_admin')
  with check ((select public.current_admin_role()) = 'super_admin');

-- ---------------------------------------------------------------------
-- Grants: the anonymous (public) role can read master data and published
-- vacancies, nothing else.
-- ---------------------------------------------------------------------
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
grant select on public.countries, public.job_categories, public.published_vacancies to anon;
grant select on public.published_vacancies to authenticated;

revoke execute on function public.dashboard_stats() from public, anon;
revoke execute on function public.match_candidates(uuid) from public, anon;
grant execute on function public.dashboard_stats() to authenticated;
grant execute on function public.match_candidates(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Private storage bucket for candidate documents (5 MB, restricted types)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'candidate-documents', 'candidate-documents', false, 5242880,
  array['application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg', 'image/png']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Only super admins and recruiters can read files (via short-lived signed URLs).
-- Uploads happen only through one-time signed upload URLs issued by the server.
create policy "staff read candidate documents" on storage.objects for select to authenticated
  using (bucket_id = 'candidate-documents'
         and (select public.current_admin_role()) in ('super_admin', 'recruiter'));
