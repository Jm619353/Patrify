export type InsuranceCoverageType =
  | 'Cobertura Total / Casco'
  | 'Roubo e Furto Qualificado'
  | 'Danos Elétricos e Líquidos'
  | 'Garantia Estendida Fabricante'
  | 'Incêndio e Riscos Patrimoniais';

export type InsuranceStatus = 'Vigente' | 'Sinistro Acionado' | 'Vencida' | 'Cancelada';

export interface InsuranceItem {
  id: string;
  patrimonyId: string;
  patrimonyName: string;
  serialNumber: string;
  category: string;
  policyNumber: string;
  insurer: string;
  coverageType: InsuranceCoverageType;
  insuredAmount: number;
  premiumCost: number;
  deductible: number;
  startDate: string;
  endDate: string;
  status: InsuranceStatus;
  brokerContact?: string | null;
  claimNotes?: string | null;
  claimedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InsuranceSummary {
  total: number;
  active: number;
  expiringSoon: number;
  claimed: number;
  totalInsuredAmount: number;
  totalPremiumCost: number;
}

export interface CreateInsurancePayload {
  patrimonyId: string;
  policyNumber: string;
  insurer: string;
  coverageType: InsuranceCoverageType;
  insuredAmount: number;
  premiumCost?: number;
  deductible?: number;
  startDate: string;
  endDate: string;
  brokerContact?: string | null;
  notes?: string | null;
}

export interface UpdateInsurancePayload {
  status?: InsuranceStatus;
  endDate?: string;
  claimNotes?: string | null;
  notes?: string | null;
}

export const INSURANCE_TYPES: InsuranceCoverageType[] = [
  'Cobertura Total / Casco',
  'Roubo e Furto Qualificado',
  'Danos Elétricos e Líquidos',
  'Garantia Estendida Fabricante',
  'Incêndio e Riscos Patrimoniais'
];

export const INSURANCE_STATUSES: InsuranceStatus[] = [
  'Vigente',
  'Sinistro Acionado',
  'Vencida',
  'Cancelada'
];
