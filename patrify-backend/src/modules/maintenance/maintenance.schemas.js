const { z } = require('zod');
const { parseMoney } = require('../../shared/utils/money');

const MAINTENANCE_TYPES = ['Preventiva', 'Corretiva', 'Calibração', 'Upgrade', 'Garantia'];
const MAINTENANCE_PRIORITIES = ['Baixa', 'Média', 'Alta', 'Crítica'];
const MAINTENANCE_STATUSES = ['Aberta', 'Em andamento', 'Concluída', 'Cancelada'];

const optionalText = (max = 200) =>
  z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z.string().trim().max(max).optional()
  );

const dateSchema = z
  .string({ required_error: 'Data agendada é obrigatória.' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD.')
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()), 'Data inválida.');

const costSchema = z.preprocess(
  (value) => (value === undefined || value === null || value === '' ? 0 : parseMoney(value)),
  z.number({ invalid_type_error: 'Custo inválido.' }).min(0).max(999_999_999.99)
);

const optionalCostSchema = z.preprocess(
  (value) => (value === undefined || value === null || value === '' ? undefined : parseMoney(value)),
  z.number({ invalid_type_error: 'Custo inválido.' }).min(0).max(999_999_999.99).optional()
);

const idSchema = z.object({
  id: z
    .string({ required_error: 'Identificador é obrigatório.' })
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, 'Identificador inválido.')
});

const createMaintenanceSchema = z.object({
  patrimonyId: z
    .string({ required_error: 'Selecione o patrimônio.' })
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, 'Patrimônio inválido.'),
  title: z.string().trim().min(3, 'Informe a descrição curta do serviço.').max(180),
  type: z.enum(MAINTENANCE_TYPES).default('Preventiva'),
  priority: z.enum(MAINTENANCE_PRIORITIES).default('Média'),
  status: z.enum(MAINTENANCE_STATUSES).default('Aberta'),
  provider: optionalText(160),
  cost: costSchema.default(0),
  scheduledDate: dateSchema,
  notes: optionalText(1000)
});

const updateMaintenanceSchema = z
  .object({
    title: z.string().trim().min(3).max(180).optional(),
    type: z.enum(MAINTENANCE_TYPES).optional(),
    priority: z.enum(MAINTENANCE_PRIORITIES).optional(),
    status: z.enum(MAINTENANCE_STATUSES).optional(),
    provider: optionalText(160),
    cost: optionalCostSchema,
    scheduledDate: dateSchema.optional(),
    notes: optionalText(1000)
  })
  .refine((data) => Object.keys(data).length > 0, 'Informe ao menos um campo para atualizar.');

const listMaintenanceQuerySchema = z.object({
  status: z.enum(MAINTENANCE_STATUSES).optional(),
  type: z.enum(MAINTENANCE_TYPES).optional(),
  priority: z.enum(MAINTENANCE_PRIORITIES).optional(),
  patrimonyId: z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/)
    .optional(),
  search: z.string().trim().max(120).optional()
});

module.exports = {
  MAINTENANCE_TYPES,
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_STATUSES,
  idSchema,
  createMaintenanceSchema,
  updateMaintenanceSchema,
  listMaintenanceQuerySchema
};
