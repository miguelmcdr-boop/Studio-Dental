/**
 * Tests del filtro de caching de Supabase — F7-06
 *
 * Valida que la lógica de filtrado del Service Worker excluye correctamente
 * los endpoints de Supabase que sirven PHI (información de salud protegida):
 * /rest/v1/, /storage/v1/, /auth/v1/, /realtime/v1/.
 *
 * Estrategia: se prueba la función pura debeCachearSupabase() del util
 * src/utils/supabaseCacheFilter.js, que es la fuente de verdad del filtrado.
 * La misma lógica se replica inline en vite.config.js (ver comentario allí)
 * porque vite.config.js no puede importar módulos ESM de src/ al construir
 * el SW de forma confiable.
 */
import { describe, it, expect } from 'vitest'
import { debeCachearSupabase } from './src/utils/supabaseCacheFilter.js'

describe('F7-06: filtro de caching de Supabase (debeCachearSupabase)', () => {
  describe('Exclusiones de PHI (debe retornar false)', () => {
    it('excluye /rest/v1/ (datos clínicos: pacientes, recetas, evoluciones)', () => {
      expect(debeCachearSupabase({ url: new URL('https://xxx.supabase.co/rest/v1/pacientes?select=*') })).toBe(false)
      expect(debeCachearSupabase({ url: new URL('https://xxx.supabase.co/rest/v1/recetas') })).toBe(false)
      expect(debeCachearSupabase({ url: new URL('https://xxx.supabase.co/rest/v1/vademecum') })).toBe(false)
    })

    it('excluye /storage/v1/ (blobs de adjuntos clínicos)', () => {
      expect(debeCachearSupabase({ url: new URL('https://xxx.supabase.co/storage/v1/object/adjuntos/rx.png') })).toBe(false)
    })

    it('excluye /auth/v1/ (tokens de sesión)', () => {
      expect(debeCachearSupabase({ url: new URL('https://xxx.supabase.co/auth/v1/token?grant_type=password') })).toBe(false)
    })

    it('excluye /realtime/v1/ (WebSocket)', () => {
      expect(debeCachearSupabase({ url: new URL('https://xxx.supabase.co/realtime/v1/websocket') })).toBe(false)
    })
  })

  describe('Inclusiones (debe retornar true)', () => {
    it('permite cachear assets estáticos del dominio Supabase (paths no sensibles)', () => {
      expect(debeCachearSupabase({ url: new URL('https://xxx.supabase.co/favicon.ico') })).toBe(true)
      expect(debeCachearSupabase({ url: new URL('https://xxx.supabase.co/') })).toBe(true)
    })
  })

  describe('Rechazo de dominios no-Supabase', () => {
    it('rechaza dominios que no contienen supabase', () => {
      expect(debeCachearSupabase({ url: new URL('https://cdn.jsdelivr.net/npm/react.js') })).toBe(false)
      expect(debeCachearSupabase({ url: new URL('https://api.github.com/repos') })).toBe(false)
    })
  })
})
