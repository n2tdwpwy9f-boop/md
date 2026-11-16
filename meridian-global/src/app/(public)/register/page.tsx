import type { Metadata } from 'next';
import RegistrationForm from '@/components/public/RegistrationForm';
import { getCategories, getCountries } from '@/lib/public-data';

export const metadata: Metadata = {
  title: 'Candidate Registration',
  description: 'Register your profile for international employment opportunities.',
};
export const revalidate = 120;

export default async function RegisterPage() {
  const [countries, categories] = await Promise.all([getCountries(), getCategories()]);
  return (
    <div className="bg-navy-50/60">
      <section className="bg-brand-500 py-12 text-white">
        <div className="container-page">
          <p className="eyebrow text-brand-200">Candidate registration</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Register your profile</h1>
          <p className="mt-3 max-w-2xl text-navy-200">
            Six short steps. Your progress is saved as you go, and you can move back and forward at any time.
          </p>
        </div>
      </section>
      <div className="container-page max-w-4xl py-10 sm:py-14">
        <RegistrationForm countries={countries.map((c) => c.name)} categories={categories.map((c) => c.name)} />
      </div>
    </div>
  );
}
