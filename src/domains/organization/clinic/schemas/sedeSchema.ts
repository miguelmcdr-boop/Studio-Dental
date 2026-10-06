import { z } from 'zod'

export const sedeSchema = z.object({
  id: z.string().uuid().optional(),
  clinicaId: z.string().optional(),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  direccion: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  comuna: z.string().min(2, 'La comuna es obligatoria'),
  region: z.string().min(2, 'La región es obligatoria'),
  telefono: z.string().optional(),
  horario: z.string().optional(),
  activa: z.boolean().default(true),
})

export type Sede = z.infer<typeof sedeSchema>
