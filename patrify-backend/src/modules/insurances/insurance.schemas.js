const { z } = require('zod');

const INSURANCE_TYPES = [
  'Cobertura Total / Casco',
  'Roubo e Furto Qualificado',
  'Danos Elétricos e Líquidos',
  'Garantia Estendida Fabricante',
  'Incêndio e Riscos Patrimoniais'
];

const INSURANCE_STATUSES = ['Vigente', 'Sinistro Acionado', 'Vencida', 'Cancelada'];

const objectIdRegex = /^[a-f\d]{24}$/i;

const idSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Identificador inválido.')
});

const createInsuranceSchema = z.object({
  patrimonyId: z.string().regex(objectIdRegex, 'Selecione um patrimônio válido.'),
  policyNumber: z
    .string({ required_error: 'Informe o número da apólice ou contrato.' })
    .trim()
    .min(3, 'O número da apólice deve ter ao menos 3 caracteres.')
    .max(80),
  insurer: z
    .string({ required_error: 'Informe a seguradora ou fornecedor da garantia.' })
    .trim()
    .min(2, 'Informe o nome da seguradora.')
    .max(120),
  coverageType: z.enum(INSURANCE_TYPES, {
    errorMap: () => ({ message: 'Selecione um tipo de cobertura válido.' })
  }),
  insuredAmount: z.coerce.number().min(0, 'O valor segurado não pode ser negativo.'),
  premiumCost: z.coerce.number().min(0, 'O valor do prêmio não pode ser negativo.').default(0),
  deductible: z.coerce.number().min(0, 'O valor da franquia não pode ser negativo.').default(0),
  startDate: z
    .string({ required_error: 'Informe o início da vigência.' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inicial inválida (AAAA-MM-DD).'),
  endDate: z
    .string({ required_error: 'Informe o término da vigência.' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data final inválida (AAAA-MM-DD).'),
  brokerContact: z.string().trim().max(120).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable()
});

const updateInsuranceSchema = z
  .object({
    status: z.enum(INSURANCE_STATUSES).optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data final inválida (AAAA-MM-DD).')
      .optional(),
    claimNotes: z.string().trim().max(500).optional().nullable(),
    notes: z.string().trim().max(500).optional().nullable()
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'Envie ao menos um campo para atualizar.'
  });

const listInsuranceQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.enum(INSURANCE_STATUSES).optional(),
  coverageType: z.enum(INSURANCE_TYPES).optional(),
  patrimonyId: z.string().regex(objectIdRegex).optional()
});

module.exports = {
  INSURANCE_TYPES,
  INSURANCE_STATUSES,
  idSchema,
  createInsuranceSchema,
  updateInsuranceSchema,
  listInsuranceQuerySchema
};
