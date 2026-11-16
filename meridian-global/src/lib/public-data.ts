import { DEFAULT_CATEGORIES, DEFAULT_COUNTRIES } from './constants';
import { supabasePublic } from './supabase/server';

export type Country = { name: string; iso_code: string | null; description: string | null };
export type Category = { name: string; icon: string; description: string | null };
export type Vacancy = {
  id: string; requirement_code: string; destination_country: string; job_category: string;
  job_position: string; workers_required: number; min_qualification: string | null;
  min_experience_years: number; employment_type: string | null; salary_range: string | null;
  benefits: string | null; application_deadline: string | null;
};

// Each loader falls back to the built-in defaults so the public site still renders
// if the database is unreachable or not yet set up.
export async function getCountries(): Promise<Country[]> {
  try {
    const db = supabasePublic();
    if (!db) return DEFAULT_COUNTRIES;
    const { data, error } = await db.from('countries').select('name,iso_code,description')
      .eq('is_active', true).order('sort_order').order('name');
    if (error || !data?.length) return DEFAULT_COUNTRIES;
    return data;
  } catch {
    return DEFAULT_COUNTRIES;
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const db = supabasePublic();
    if (!db) return DEFAULT_CATEGORIES;
    const { data, error } = await db.from('job_categories').select('name,icon,description')
      .eq('is_active', true).order('sort_order').order('name');
    if (error || !data?.length) return DEFAULT_CATEGORIES;
    return data;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

// Only vacancies an admin has explicitly published are ever shown publicly.
export async function getPublishedVacancies(): Promise<Vacancy[]> {
  try {
    const db = supabasePublic();
    if (!db) return [];
    const { data } = await db.from('published_vacancies').select('*')
      .order('created_at', { ascending: false }).limit(12);
    return data || [];
  } catch {
    return [];
  }
}
