const { z } = require('zod');
const { normalizeCnpj, isValidCnpj } = require('../../shared/utils/cnpj');
const {
  PATRIMONY_CATEGORIES,
  PATRIMONY_STATUSES,
  PATRIMONY_CONDITIONS
} = require('../patrimony/patrimony.schemas');

const objectIdRegex = /^[a-f\d]{24}$/i;

const idSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Identificador inválido.')
});

const cnpjField = z
  .string({ required_error: 'Informe o CNPJ.' })
  .transform((val) => normalizeCnpj(val))
  .refine((val) => val.length === 14, 'O CNPJ deve conter 14 dígitos.')
  .refine((val) => isValidCnpj(val), 'Informe um CNPJ válido.');

const createAdminUserSchema = z.object({
  name: z
    .string({ required_error: 'Informe o nome fantasia da empresa.' })
    .trim()
    .min(2, 'O nome deve ter pelo menos 2 caracteres.')
    .max(120),
  legalName: z.string().trim().max(160).optional().nullable(),
  cnpj: cnpjField,
  email: z
    .string({ required_error: 'Informe o e-mail.' })
    .trim()
    .email('Informe um e-mail válido.')
    .max(160),
  password: z
    .string({ required_error: 'Informe a senha inicial.' })
    .min(6, 'A senha deve ter no mínimo 6 caracteres.')
    .max(100),
  phone1: z.string().trim().max(30).optional().nullable(),
  phone2: z.string().trim().max(30).optional().nullable(),
  address: z.string().trim().max(240).optional().nullable(),
  economicActivity: z.string().trim().max(160).optional().nullable(),
  branchType: z.string().trim().max(40).optional().nullable(),
  companySize: z.string().trim().max(60).optional().nullable(),
  role: z.enum(['admin', 'company']).default('company'),
  plan: z.enum(['basic', 'pro', 'enterprise']).default('basic'),
  active: z.boolean().default(true)
});

const updateAdminUserSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    legalName: z.string().trim().max(160).optional().nullable(),
    cnpj: cnpjField.optional(),
    email: z.string().trim().email('E-mail inválido.').max(160).optional(),
    password: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres.').max(100).optional(),
    phone1: z.string().trim().max(30).optional().nullable(),
    phone2: z.string().trim().max(30).optional().nullable(),
    address: z.string().trim().max(240).optional().nullable(),
    economicActivity: z.string().trim().max(160).optional().nullable(),
    branchType: z.string().trim().max(40).optional().nullable(),
    companySize: z.string().trim().max(60).optional().nullable(),
    role: z.enum(['admin', 'company']).optional(),
    plan: z.enum(['basic', 'pro', 'enterprise']).optional(),
    active: z.boolean().optional()
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'Envie ao menos um campo para atualizar.'
  });

const listAdminPatrimoniesQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  userId: z.string().regex(objectIdRegex).optional(),
  category: z.enum(PATRIMONY_CATEGORIES).optional(),
  status: z.enum(PATRIMONY_STATUSES).optional()
});

const createAdminPatrimonySchema = z.object({
  userId: z.string().regex(objectIdRegex, 'Selecione a empresa proprietária.'),
  name: z.string().trim().min(2, 'Informe o nome do patrimônio.').max(120),
  value: z.coerce.number().min(0, 'O valor não pode ser negativo.'),
  quantity: z.coerce.number().int().min(1).max(100_000).default(1),
  purchaseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (AAAA-MM-DD).'),
  location: z.string().trim().min(2, 'Informe a localização.').max(120),
  status: z.enum(PATRIMONY_STATUSES).default('Ativo'),
  condition: z.enum(PATRIMONY_CONDITIONS).default('Bom'),
  category: z.enum(PATRIMONY_CATEGORIES),
  responsible: z.string().trim().max(120).optional().nullable(),
  invoiceNumber: z.string().trim().max(60).optional().nullable(),
  warrantyUntil: z.string().optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable()
});

const updateAdminPatrimonySchema = z
  .object({
    userId: z.string().regex(objectIdRegex).optional(),
    name: z.string().trim().min(2).max(120).optional(),
    value: z.coerce.number().min(0).optional(),
    quantity: z.coerce.number().int().min(1).max(100_000).optional(),
    purchaseDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    location: z.string().trim().min(2).max(120).optional(),
    status: z.enum(PATRIMONY_STATUSES).optional(),
    condition: z.enum(PATRIMONY_CONDITIONS).optional(),
    category: z.enum(PATRIMONY_CATEGORIES).optional(),
    responsible: z.string().trim().max(120).optional().nullable(),
    invoiceNumber: z.string().trim().max(60).optional().nullable(),
    warrantyUntil: z.string().optional().nullable(),
    notes: z.string().trim().max(500).optional().nullable()
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'Envie ao menos um campo para atualizar.'
  });

module.exports = {
  idSchema,
  createAdminUserSchema,
  updateAdminUserSchema,
  listAdminPatrimoniesQuerySchema,
  createAdminPatrimonySchema,
  updateAdminPatrimonySchema
};
