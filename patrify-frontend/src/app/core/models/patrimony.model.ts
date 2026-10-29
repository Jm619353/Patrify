export const PATRIMONY_CATEGORIES = [
  'Tecnologia',
  'Mobiliário',
  'Industrial',
  'Transporte',
  'Logística',
  'Segurança',
  'Laboratorial',
  'Produção'
] as const;

export const PATRIMONY_STATUSES = ['Ativo', 'Não ativo'] as const;

export const PATRIMONY_CONDITIONS = [
  'Novo',
  'Excelente',
  'Regular',
  'Com defeitos',
  'Obsoleto',
  'Descartado'
] as const;

export const PATRIMONY_MOVEMENT_TYPES = [
  'Cadastro',
  'Transferência',
  'Manutenção',
  'Auditoria',
  'Alteração de status',
  'Observação'
] as const;

export type PatrimonyCategory = (typeof PATRIMONY_CATEGORIES)[number];
export type PatrimonyStatus = (typeof PATRIMONY_STATUSES)[number];
export type PatrimonyCondition = (typeof PATRIMONY_CONDITIONS)[number];
export type PatrimonyMovementType = (typeof PATRIMONY_MOVEMENT_TYPES)[number];

export type PatrimonySort =
  | 'name'
  | 'value'
  | 'purchaseDate'
  | 'createdAt'
  | 'category'
  | 'status'
  | 'condition';

export interface PatrimonyDepreciation {
  annualRatePercent: number;
  ageMonths: number;
  unitDepreciatedValue: number;
  totalAcquisitionValue: number;
  totalDepreciatedValue: number;
  depreciationAmount: number;
  depreciationPercent: number;
}

export interface PatrimonyMovement {
  id: string;
  type: PatrimonyMovementType | string;
  description: string;
  location: string | null;
  responsible: string | null;
  status: PatrimonyStatus;
  condition: PatrimonyCondition;
  createdAt: string;
}

export interface Patrimony {
  id: string;
  name: string;
  value: number;
  purchaseDate: string;
  location: string | null;
  status: PatrimonyStatus;
  condition: PatrimonyCondition;
  category: PatrimonyCategory;
  serialNumber: string;
  quantity: number;
  imageUrl: string | null;
  responsible?: string | null;
  invoiceNumber?: string | null;
  warrantyUntil?: string | null;
  notes?: string | null;
  depreciation?: PatrimonyDepreciation;
  movements?: PatrimonyMovement[];
  createdAt: string;
  updatedAt: string;
}

export interface PatrimonyPayload {
  name: string;
  value: number;
  purchaseDate: string;
  location?: string | null;
  status: PatrimonyStatus;
  condition: PatrimonyCondition;
  category: PatrimonyCategory;
  quantity: number;
  responsible?: string | null;
  invoiceNumber?: string | null;
  warrantyUntil?: string | null;
  notes?: string | null;
}

export interface PatrimonyMovementPayload {
  type: string;
  description: string;
  location?: string | null;
  responsible?: string | null;
  status?: PatrimonyStatus;
  condition?: PatrimonyCondition;
}

export interface PatrimonyQrCode {
  patrimonyId: string;
  serialNumber: string;
  name: string;
  category: string;
  location: string | null;
  verificationUrl: string;
  qrCodeDataUrl: string;
}

export interface PublicPatrimonyVerification {
  patrimony: Patrimony;
  company: {
    name: string;
    legalName: string | null;
    cnpj: string;
    email: string | null;
    phone1: string | null;
    address: string | null;
    branchType: string | null;
  } | null;
  verificationUrl: string;
  qrCodeDataUrl: string;
  verifiedAt: string;
}

export interface PatrimonyQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: PatrimonyStatus;
  category?: PatrimonyCategory;
  condition?: PatrimonyCondition;
  minValue?: number;
  maxValue?: number;
  from?: string;
  to?: string;
  sort?: PatrimonySort;
  order?: 'asc' | 'desc';
}

export interface PatrimonyTotals {
  items: number;
  active: number;
  inactive: number;
  discarded: number;
  totalValue: number;
  activeValue: number;
  inactiveValue: number;
  discardedValue: number;
  depreciatedValue?: number;
}

export interface CategorySummary {
  category: string;
  items: number;
  value: number;
}

export interface ConditionSummary {
  condition: string;
  items: number;
}

export interface ValueHistoryPoint {
  month: string;
  value: number;
}

export interface PatrimonySummary {
  totals: PatrimonyTotals;
  byCategory: CategorySummary[];
  byCondition: ConditionSummary[];
  valueHistory: ValueHistoryPoint[];
  recent: Patrimony[];
}
