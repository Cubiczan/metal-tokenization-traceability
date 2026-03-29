export interface MetalToken {
  symbol: string;
  name: string;
  metalType: string;
  spotPrice: number;
  change24h: number;
  totalSupply: number;
  totalBacked: number;
  backingRatio: number;
  mintFeeBps: number;
  redeemFeeBps: number;
  color: string;
}

export interface Vault {
  id: string;
  name: string;
  location: string;
  custodian: string;
  license: string;
  status: 'Active' | 'Pending' | 'Suspended' | 'Draining';
  balances: { metal: string; amount: number; capacity: number }[];
  lastAttestation: string;
  attestationStatus: 'Active' | 'Pending' | 'Expired';
}

export interface MintRequest {
  id: string;
  metal: string;
  amount: number;
  fee: number;
  netAmount: number;
  vault: string;
  status: 'Pending' | 'Approved' | 'Completed' | 'Rejected';
  createdAt: string;
  requester: string;
}

export interface RedeemRequest {
  id: string;
  metal: string;
  amount: number;
  vault: string;
  deliveryPreference: string;
  status: 'Pending' | 'Processing' | 'Ready' | 'Delivered';
  createdAt: string;
  requester: string;
}

export interface Attestation {
  id: string;
  vaultId: string;
  vaultName: string;
  metal: string;
  amount: number;
  barCount: number;
  signers: number;
  threshold: number;
  status: 'Pending' | 'Active' | 'Expired' | 'Revoked';
  submittedAt: string;
  expiresAt: string;
}

export const metals: MetalToken[] = [
  { symbol: 'xGLD', name: 'Gold', metalType: 'Gold', spotPrice: 2438.50, change24h: 1.24, totalSupply: 125430, totalBacked: 125430, backingRatio: 1.0, mintFeeBps: 25, redeemFeeBps: 50, color: 'gold' },
  { symbol: 'xSLV', name: 'Silver', metalType: 'Silver', spotPrice: 31.42, change24h: -0.58, totalSupply: 2450000, totalBacked: 2450000, backingRatio: 1.0, mintFeeBps: 30, redeemFeeBps: 60, color: 'silver' },
  { symbol: 'xPLT', name: 'Platinum', metalType: 'Platinum', spotPrice: 982.30, change24h: 0.87, totalSupply: 45200, totalBacked: 45200, backingRatio: 1.0, mintFeeBps: 35, redeemFeeBps: 70, color: 'platinum' },
  { symbol: 'xPLD', name: 'Palladium', metalType: 'Palladium', spotPrice: 1024.80, change24h: -1.12, totalSupply: 18750, totalBacked: 18750, backingRatio: 1.0, mintFeeBps: 35, redeemFeeBps: 70, color: 'palladium' },
];

export const vaults: Vault[] = [
  { id: 'V-001', name: 'London LBMA Vault', location: 'London, UK', custodian: 'Brinks', license: 'LBMA-2024-001', status: 'Active', balances: [{ metal: 'Gold', amount: 52400, capacity: 100000 }, { metal: 'Silver', amount: 850000, capacity: 2000000 }], lastAttestation: '2025-06-14T08:30:00Z', attestationStatus: 'Active' },
  { id: 'V-002', name: 'Zurich EQ Vault', location: 'Zurich, Switzerland', custodian: 'EQ Bank', license: 'EQ-2024-042', status: 'Active', balances: [{ metal: 'Gold', amount: 38200, capacity: 80000 }, { metal: 'Platinum', amount: 22100, capacity: 50000 }], lastAttestation: '2025-06-14T06:15:00Z', attestationStatus: 'Active' },
  { id: 'V-003', name: 'Singapore STO Vault', location: 'Singapore', custodian: 'Malca-Amit', license: 'STO-2024-088', status: 'Active', balances: [{ metal: 'Gold', amount: 34830, capacity: 60000 }, { metal: 'Palladium', amount: 18750, capacity: 30000 }], lastAttestation: '2025-06-13T22:45:00Z', attestationStatus: 'Active' },
  { id: 'V-004', name: 'Perth PMR Vault', location: 'Perth, Australia', custodian: 'Perth Mint', license: 'PMR-2024-015', status: 'Pending', balances: [{ metal: 'Silver', amount: 1600000, capacity: 3000000 }], lastAttestation: '2025-06-12T14:00:00Z', attestationStatus: 'Pending' },
];

export const mintRequests: MintRequest[] = [
  { id: 'MR-001', metal: 'xGLD', amount: 500, fee: 1.25, netAmount: 498.75, vault: 'London LBMA Vault', status: 'Completed', createdAt: '2025-06-14T10:30:00Z', requester: '7xKXt...' },
  { id: 'MR-002', metal: 'xSLV', amount: 50000, fee: 150, netAmount: 49850, vault: 'Perth PMR Vault', status: 'Pending', createdAt: '2025-06-14T11:15:00Z', requester: '3mPqR...' },
  { id: 'MR-003', metal: 'xGLD', amount: 1200, fee: 3.0, netAmount: 1197, vault: 'Zurich EQ Vault', status: 'Approved', createdAt: '2025-06-14T09:00:00Z', requester: '9fLwX...' },
  { id: 'MR-004', metal: 'xPLT', amount: 250, fee: 0.875, netAmount: 249.125, vault: 'Zurich EQ Vault', status: 'Completed', createdAt: '2025-06-13T16:45:00Z', requester: '5kNvB...' },
  { id: 'MR-005', metal: 'xPLD', amount: 100, fee: 0.35, netAmount: 99.65, vault: 'Singapore STO Vault', status: 'Rejected', createdAt: '2025-06-13T14:20:00Z', requester: '2jHcM...' },
];

export const redeemRequests: RedeemRequest[] = [
  { id: 'RR-001', metal: 'xGLD', amount: 100, vault: 'London LBMA Vault', deliveryPreference: 'Bar (1kg)', status: 'Processing', createdAt: '2025-06-14T07:00:00Z', requester: '4pTgA...' },
  { id: 'RR-002', metal: 'xSLV', amount: 10000, vault: 'Perth PMR Vault', deliveryPreference: 'Grain', status: 'Pending', createdAt: '2025-06-14T08:30:00Z', requester: '8rWqD...' },
  { id: 'RR-003', metal: 'xGLD', amount: 50, vault: 'Zurich EQ Vault', deliveryPreference: 'Bar (100g)', status: 'Ready', createdAt: '2025-06-13T11:00:00Z', requester: '1nYsK...' },
];

export const attestations: Attestation[] = [
  { id: 'ATT-001', vaultId: 'V-001', vaultName: 'London LBMA Vault', metal: 'Gold', amount: 52400, barCount: 524, signers: 4, threshold: 3, status: 'Active', submittedAt: '2025-06-14T08:30:00Z', expiresAt: '2025-06-15T08:30:00Z' },
  { id: 'ATT-002', vaultId: 'V-002', vaultName: 'Zurich EQ Vault', metal: 'Gold', amount: 38200, barCount: 382, signers: 3, threshold: 3, status: 'Active', submittedAt: '2025-06-14T06:15:00Z', expiresAt: '2025-06-15T06:15:00Z' },
  { id: 'ATT-003', vaultId: 'V-003', vaultName: 'Singapore STO Vault', metal: 'Gold', amount: 34830, barCount: 348, signers: 5, threshold: 3, status: 'Active', submittedAt: '2025-06-13T22:45:00Z', expiresAt: '2025-06-14T22:45:00Z' },
  { id: 'ATT-004', vaultId: 'V-001', vaultName: 'London LBMA Vault', metal: 'Silver', amount: 850000, barCount: 850, signers: 3, threshold: 3, status: 'Active', submittedAt: '2025-06-14T08:30:00Z', expiresAt: '2025-06-15T08:30:00Z' },
  { id: 'ATT-005', vaultId: 'V-004', vaultName: 'Perth PMR Vault', metal: 'Silver', amount: 1600000, barCount: 1600, signers: 2, threshold: 3, status: 'Pending', submittedAt: '2025-06-12T14:00:00Z', expiresAt: '2025-06-13T14:00:00Z' },
];

export const supplyHistory = [
  { date: '2025-01', xGLD: 45000, xSLV: 800000, xPLT: 12000, xPLD: 5000 },
  { date: '2025-02', xGLD: 58000, xSLV: 1100000, xPLT: 18000, xPLD: 8000 },
  { date: '2025-03', xGLD: 72000, xSLV: 1450000, xPLT: 25000, xPLD: 11000 },
  { date: '2025-04', xGLD: 88000, xSLV: 1800000, xPLT: 32000, xPLD: 14000 },
  { date: '2025-05', xGLD: 108000, xSLV: 2100000, xPLT: 39000, xPLD: 16500 },
  { date: '2025-06', xGLD: 125430, xSLV: 2450000, xPLT: 45200, xPLD: 18750 },
];

export function formatNumber(n: number, decimals = 0): string {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
}

export function formatUSD(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export function getTotalMarketCap(): number {
  return metals.reduce((sum, m) => sum + m.totalSupply * m.spotPrice, 0);
}
