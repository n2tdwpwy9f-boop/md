import {
  Briefcase, Building2, Calculator, Cog, Factory, Fuel, Globe, GraduationCap, HardHat, Hotel,
  Laptop, Plane, ShieldCheck, Stethoscope, TrendingUp, Truck, Users, UtensilsCrossed, Warehouse, Wrench,
  type LucideIcon,
} from 'lucide-react';

// Icons an admin can assign to a job category.
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  'hard-hat': HardHat,
  cog: Cog,
  stethoscope: Stethoscope,
  hotel: Hotel,
  utensils: UtensilsCrossed,
  truck: Truck,
  warehouse: Warehouse,
  factory: Factory,
  fuel: Fuel,
  laptop: Laptop,
  'trending-up': TrendingUp,
  calculator: Calculator,
  shield: ShieldCheck,
  wrench: Wrench,
  users: Users,
  globe: Globe,
  plane: Plane,
  graduation: GraduationCap,
  building: Building2,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = CATEGORY_ICONS[name] || Briefcase;
  return <Icon className={className} aria-hidden />;
}
