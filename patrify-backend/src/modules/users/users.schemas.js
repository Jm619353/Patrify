const { z } = require('zod');

const optionalText = (max = 160) =>
  z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z.string().trim().max(max).optional()
  );

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2, 'Informe o nome da empresa.').max(160).optional(),
    email: z.string().trim().toLowerCase().email('E-mail inválido.').max(160).optional(),
    phone1: optionalText(20),
    phone2: optionalText(20),
    branchType: optionalText(50),
    companySize: optionalText(50)
  })
  .refine((data) => Object.keys(data).length > 0, 'Informe ao menos um campo para atualizar.');

module.exports = { updateProfileSchema };
