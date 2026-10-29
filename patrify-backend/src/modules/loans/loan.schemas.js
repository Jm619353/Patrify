const { z } = require('zod');

const LOAN_STATUSES = ['Em andamento', 'Devolvido', 'Cancelado'];

const objectIdRegex = /^[a-f\d]{24}$/i;

const idSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Identificador inválido.')
});

const createLoanSchema = z.object({
  patrimonyId: z.string().regex(objectIdRegex, 'Selecione um patrimônio válido.'),
  borrowerName: z
    .string({ required_error: 'Informe o nome do responsável pelo empréstimo.' })
    .trim()
    .min(2, 'O nome do solicitante deve ter ao menos 2 caracteres.')
    .max(120),
  borrowerDocument: z.string().trim().max(40).optional().nullable(),
  department: z
    .string({ required_error: 'Informe o setor ou departamento.' })
    .trim()
    .min(2, 'Informe o setor/departamento.')
    .max(100),
  purpose: z
    .string({ required_error: 'Informe a finalidade do empréstimo.' })
    .trim()
    .min(3, 'Descreva a finalidade do empréstimo.')
    .max(240),
  loanDate: z
    .string({ required_error: 'Informe a data de retirada.' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de retirada inválida (AAAA-MM-DD).'),
  expectedReturnDate: z
    .string({ required_error: 'Informe a previsão de devolução.' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Previsão de devolução inválida (AAAA-MM-DD).'),
  conditionOut: z.string().trim().max(80).default('Excelente'),
  notes: z.string().trim().max(500).optional().nullable()
});

const updateLoanSchema = z
  .object({
    status: z.enum(LOAN_STATUSES).optional(),
    expectedReturnDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Previsão de devolução inválida (AAAA-MM-DD).')
      .optional(),
    conditionIn: z.string().trim().max(80).optional().nullable(),
    notes: z.string().trim().max(500).optional().nullable()
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'Envie ao menos um campo para atualizar.'
  });

const listLoanQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.enum(LOAN_STATUSES).optional(),
  patrimonyId: z.string().regex(objectIdRegex).optional()
});

module.exports = {
  LOAN_STATUSES,
  idSchema,
  createLoanSchema,
  updateLoanSchema,
  listLoanQuerySchema
};
