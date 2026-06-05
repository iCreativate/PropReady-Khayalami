export const BOND_ORIGINATORS = [
    { id: 'sa-home-loans', name: 'SA Home Loans' },
    { id: 'betterbond', name: 'BetterBond' },
    { id: 'ooba', name: 'Ooba' },
] as const;

export type BondOriginatorId = (typeof BOND_ORIGINATORS)[number]['id'];

export function bondOriginatorLabel(id?: string | null): string | null {
    if (!id) return null;
    const found = BOND_ORIGINATORS.find((o) => o.id === id || o.name.toLowerCase() === id.toLowerCase());
    if (found) return found.name;
    return id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
