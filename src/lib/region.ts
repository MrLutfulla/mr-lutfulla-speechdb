export type RegionValue = string | { level1: string; level2?: string | null } | null | undefined;

export function normalizeRegion(region: RegionValue): { level1: string; level2?: string } {
  if (!region) return { level1: '' };
  if (typeof region === 'string') return { level1: region };
  return { level1: region.level1 || '', level2: region.level2 || undefined };
}

export function formatRegion(region: RegionValue): string {
  const normalized = normalizeRegion(region);
  if (!normalized.level1) return "hudud yo'q";
  if (!normalized.level2) return normalized.level1;
  return `${normalized.level1} / ${normalized.level2}`;
}
