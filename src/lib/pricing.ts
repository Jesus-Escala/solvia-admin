import type { Plan, TenantModule } from './types';

/** Price list and allowances served by `GET /admin/pricing` (the backend is the source). */
export interface PricingCatalog {
  modules: { collections: number; sales: number; inventory: number };
  discounts: Record<'1' | '2' | '3', number>;
  annualMonthsPaid: number;
  free: Allowance;
  paid: Record<'1' | '2' | '3', Allowance>;
  packSize: number;
}

export interface Allowance {
  automaticMessages: number;
  users: number;
  /** null: unlimited. */
  customers: number | null;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * What a plan choice means, as the landing's plan builder shows it: the price per month (with the
 * module discount and, yearly, 12 months for the price of `annualMonthsPaid`) and the allowance.
 * `free` pays nothing and gets the free allowance whatever the modules.
 */
export function quotePlan(catalog: PricingCatalog, plan: Plan, modules: readonly TenantModule[]) {
  const optional = [...new Set(modules)];
  const count = String(Math.min(3, 1 + optional.length)) as '1' | '2' | '3';
  if (plan === 'free') {
    return { count, free: true as const, allowance: catalog.free, price: null };
  }
  const list =
    catalog.modules.collections +
    optional.reduce((sum, module) => sum + catalog.modules[module], 0);
  const discount = catalog.discounts[count];
  const monthly = round2(list * (1 - discount));
  const annual = plan === 'pro';
  return {
    count,
    free: false as const,
    allowance: catalog.paid[count],
    price: {
      list,
      discount,
      perMonth: annual ? round2((monthly * catalog.annualMonthsPaid) / 12) : monthly,
      yearly: annual ? round2(monthly * catalog.annualMonthsPaid) : null,
    },
  };
}
