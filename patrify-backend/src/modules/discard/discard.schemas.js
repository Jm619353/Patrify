const { z } = require('zod');

const searchSchema = z.object({
  material: z
    .string({ required_error: 'Informe o tipo de material ou patrimônio.' })
    .trim()
    .min(2, 'Informe ao menos 2 caracteres.')
    .max(80),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().int().min(500).max(50_000).default(5_000)
});

module.exports = { searchSchema };
