'use client';

import MasterData from '@/components/admin/MasterData';

export default function CountriesPage() {
  return (
    <MasterData table="countries" singular="country" title="Destination Countries"
      subtitle="Countries shown on the website and offered in the registration form. Changes appear on the public site within about two minutes." />
  );
}
