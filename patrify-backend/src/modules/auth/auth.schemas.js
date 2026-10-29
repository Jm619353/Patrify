const { z } = require('zod');
const { normalizeCnpj, isValidCnpj } = require('../../shared/utils/cnpj');
const { passwordPolicy } = require('../../shared/utils/password');

const cnpjSchema = z
  .string({ required_error: 'CNPJ é obrigatório.' })
  .transform(normalizeCnpj)
  .refine(isValidCnpj, 'CNPJ inválido.');

const emailSchema = z
  .string({ required_error: 'E-mail é obrigatório.' })
  .trim()
  .toLowerCase()
  .email('E-mail inválido.')
  .max(160, 'E-mail muito longo.');

const passwordSchema = z
  .string({ required_error: 'Senha é obrigatória.' })
  .superRefine((value, ctx) => {
    const policy = passwordPolicy(value);
    if (!policy.valid) {
      policy.errors.forEach((message) => ctx.addIssue({ code: z.ZodIssueCode.custom, message }));
    }
  });

const optionalText = (max = 160) =>
  z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z.string().trim().max(max).optional()
  );

const registerSchema = z.object({
  cnpj: cnpjSchema,
  email: emailSchema,
  password: passwordSchema,
  name: optionalText(160),
  phone1: optionalText(20),
  phone2: optionalText(20),
  legalName: optionalText(200),
  address: optionalText(255),
  economicActivity: optionalText(255)
});

const loginSchema = z.object({
  cnpj: cnpjSchema,
  password: z.string().min(1, 'Senha é obrigatória.')
});

const forgotPasswordSchema = z.object({
  cnpj: cnpjSchema,
  email: emailSchema
});

const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Token inválido.'),
  password: passwordSchema
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  emailSchema,
  passwordSchema
};
