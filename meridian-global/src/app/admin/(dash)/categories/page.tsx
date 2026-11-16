'use client';

import MasterData from '@/components/admin/MasterData';

export default function CategoriesPage() {
  return (
    <MasterData table="job_categories" singular="category" title="Job Categories"
      subtitle="Categories shown on the website and offered in the registration form. Changes appear on the public site within about two minutes." />
  );
}
