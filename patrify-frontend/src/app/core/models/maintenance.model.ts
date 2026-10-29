export const MAINTENANCE_TYPES = [
  'Preventiva',
  'Corretiva',
  'Calibração',
  'Upgrade',
  'Garantia'
] as const;

export const MAINTENANCE_PRIORITIES = ['Baixa', 'Média', 'Alta', 'Crítica'] as const;

export const MAINTENANCE_STATUSES = [
  'Aberta',
  'Em andamento',
  'Concluída',
  'Cancelada'
] as const;

export type MaintenanceType = (typeof MAINTENANCE_TYPES)[number];
export type MaintenancePriority = (typeof MAINTENANCE_PRIORITIES)[number];
export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number];

export interface MaintenanceOrder {
  id: string;
  patrimonyId: string;
  patrimonyName: string;
  serialNumber: string;
  category: string;
  title: string;
  type: MaintenanceType;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  provider: string | null;
  cost: number;
  scheduledDate: string;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenancePayload {
  patrimonyId: string;
  title: string;
  type: MaintenanceType;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  provider?: string | null;
  cost: number;
  scheduledDate: string;
  notes?: string | null;
}

export interface MaintenanceSummary {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  totalCost: number;
}

export interface MaintenanceQuery {
  status?: MaintenanceStatus;
  type?: MaintenanceType;
  priority?: MaintenancePriority;
  patrimonyId?: string;
  search?: string;
}
