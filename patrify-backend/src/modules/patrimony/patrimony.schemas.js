const { z } = require('zod');
const { CATEGORIES } = require('../../shared/utils/serial');
const { parseMoney } = require('../../shared/utils/money');
const { MAX_PAGE_SIZE } = require('../../shared/utils/pagination');

const STATUSES = ['Ativo', 'Não ativo'];
const CONDITIONS = ['Novo', 'Excelente', 'Regular', 'Com defeitos', 'Obsoleto', 'Descartado'];
const SORT_FIELDS = ['name', 'value', 'purchaseDate', 'createdAt', 'category', 'status', 'condition'];
const MOVEMENT_TYPES = [
  'Cadastro',
  'Transferência',
  'Manutenção',
  'Auditoria',
  'Alteração de status',
  'Observação'
];

const optionalText = (max = 160) =>
  z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z.string().trim().max(max).optional()
  );

const moneyNumberSchema = z
  .number({ invalid_type_error: 'Valor inválido.' })
  .min(0, 'O valor não pode ser negativo.')
  .max(999_999_999.99, 'Valor acima do limite permitido.');

const valueSchema = z.preprocess(
  (value) => (value === undefined || value === null || value === '' ? undefined : parseMoney(value)),
  moneyNumberSchema
);

const optionalValueSchema = z.preprocess(
  (value) => (value === undefined || value === null || value === '' ? undefined : parseMoney(value)),
  moneyNumberSchema.optional()
);

const dateSchema = z
  .string({ required_error: 'Data de aquisição é obrigatória.' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD.')
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()), 'Data inválida.');

const optionalDateSchema = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : value),
  dateSchema.optional()
);

const idSchema = z.object({
  id: z
    .string({ required_error: 'Identificador é obrigatório.' })
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, 'Identificador inválido.')
});

const serialParamSchema = z.object({
  serial: z
    .string({ required_error: 'Código de série é obrigatório.' })
    .trim()
    .min(3, 'Código de série inválido.')
    .max(40, 'Código de série inválido.')
});

const createSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do patrimônio.').max(160),
  value: valueSchema,
  purchaseDate: dateSchema,
  location: optionalText(160),
  status: z.enum(STATUSES).default('Ativo'),
  condition: z.enum(CONDITIONS).default('Novo'),
  category: z.enum(CATEGORIES, {
    errorMap: () => ({ message: `Categoria inválida. Use: ${CATEGORIES.join(', ')}.` })
  }),
  quantity: z.coerce.number().int().min(1).max(1_000_000).default(1),
  responsible: optionalText(120),
  invoiceNumber: optionalText(60),
  warrantyUntil: optionalDateSchema,
  notes: optionalText(1000)
});

const updateSchema = z
  .object({
    name: z.string().trim().min(2).max(160).optional(),
    value: optionalValueSchema,
    purchaseDate: dateSchema.optional(),
    location: optionalText(160),
    status: z.enum(STATUSES).optional(),
    condition: z.enum(CONDITIONS).optional(),
    category: z.enum(CATEGORIES).optional(),
    quantity: z.coerce.number().int().min(1).max(1_000_000).optional(),
    responsible: optionalText(120),
    invoiceNumber: optionalText(60),
    warrantyUntil: optionalDateSchema,
    notes: optionalText(1000)
  })
  .refine((data) => Object.keys(data).length > 0, 'Informe ao menos um campo para atualizar.');

const movementSchema = z.object({
  type: z.enum(MOVEMENT_TYPES).default('Observação'),
  description: z.string().trim().min(2, 'Informe a descrição da movimentação.').max(400),
  location: optionalText(160),
  responsible: optionalText(120),
  status: z.enum(STATUSES).optional(),
  condition: z.enum(CONDITIONS).optional()
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(10),
  search: z.string().trim().max(120).optional(),
  status: z.enum(STATUSES).optional(),
  category: z.enum(CATEGORIES).optional(),
  condition: z.enum(CONDITIONS).optional(),
  minValue: z.coerce.number().min(0).optional(),
  maxValue: z.coerce.number().min(0).optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  sort: z.enum(SORT_FIELDS).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc')
});

module.exports = {
  STATUSES,
  CONDITIONS,
  CATEGORIES,
  SORT_FIELDS,
  MOVEMENT_TYPES,
  idSchema,
  serialParamSchema,
  createSchema,
  updateSchema,
  movementSchema,
  listQuerySchema
};
