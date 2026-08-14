#!/usr/bin/env node
/**
 * Script de validación F4-02e: verifica que la migración a Supabase está completa.
 * 
 * NO requiere dependencias externas - usa solo Node.js nativo.
 * 
 * Verifica:
 * 1. Tablas existen en Supabase
 * 2. Conteos de registros por tabla
 * 3. Datos migrados presentes
 *
 * Uso: node scripts/validate-f4-supabase.js
 * Lee automáticamente el archivo .env en la raíz del proyecto.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.join(__dirname, '..')

// ═══════════════════════════════════════════════════════════════════
// CARGAR VARIABLES DE ENTORNO DESDE .env
// ═══════════════════════════════════════════════════════════════════

function cargarEnv() {
  const envPath = path.join(rootDir, '.env')
  const env = {}
  
  if (!fs.existsSync(envPath)) {
    return env
  }
  
  const contenido = fs.readFileSync(envPath, 'utf-8')
  for (const linea of contenido.split('\n')) {
    const lineaLimpia = linea.trim()
    if (!lineaLimpia || lineaLimpia.startsWith('#')) continue
    
    const [key, ...valueParts] = lineaLimpia.split('=')
    if (!key || valueParts.length === 0) continue
    
    let value = valueParts.join('=').trim()
    // Quitar comillas si las tiene
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    
    env[key.trim()] = value
  }
  
  return env
}

const env = cargarEnv()
const SUPABASE_URL = env.VITE_SUPABASE_URL
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY

// ═══════════════════════════════════════════════════════════════════
// VERIFICAR CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: variables de Supabase no encontradas en .env')
  console.error('   VITE_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗')
  console.error('   VITE_SUPABASE_ANON_KEY:', SUPABASE_KEY ? '✓' : '✗')
  process.exit(1)
}

console.log('✅ Configuración de Supabase encontrada')
console.log(`   URL: ${SUPABASE_URL}`)
console.log(`   Key: ${SUPABASE_KEY.substring(0, 20)}...`)

// ═══════════════════════════════════════════════════════════════════
// HELPERS DE SUPABASE (sin SDK, usando fetch directo)
// ═══════════════════════════════════════════════════════════════════

async function querySupabase(tabla, queryParams = '') {
  const url = `${SUPABASE_URL}/rest/v1/${tabla}${queryParams}`
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'count=exact'
    }
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`${response.status}: ${errorText}`)
  }
  
  const data = await response.json()
  const countHeader = response.headers.get('content-range')
  const count = countHeader ? parseInt(countHeader.split('/')[1]) : data.length
  
  return { data, count }
}

// ═══════════════════════════════════════════════════════════════════
// TABLAS A VERIFICAR
// ═══════════════════════════════════════════════════════════════════

const TABLAS_REQUERIDAS = [
  'pacientes',
  'citas',
  'presupuestos',
  'presupuesto_items',
  'pagos',
  'movimientos_financieros',
  'evoluciones_clinicas',
  'recetas',
  'odontogramas',
  'periodontogramas',
  'periodontogramas_historial',
  'dsd_configs',
  'odontopediatria',
  'quirurgico_implantes',
  'quirurgico_endodoncia'
]

// ═══════════════════════════════════════════════════════════════════
// VERIFICACIÓN DE TABLAS
// ═══════════════════════════════════════════════════════════════════

async function verificarTablas() {
  console.log('\n🏗️  Verificando tablas y conteos...')
  console.log('─────────────────────────────────────────')
  
  let totalRegistros = 0
  let tablasConDatos = 0
  let tablasVacias = 0
  let tablasConError = 0
  
  for (const tabla of TABLAS_REQUERIDAS) {
    try {
      const { count } = await querySupabase(tabla, '?limit=1')
      const icono = count > 0 ? '🟢' : '⚪'
      console.log(`  ${icono} ${tabla.padEnd(30)} ${count} registros`)
      
      totalRegistros += count
      if (count > 0) {
        tablasConDatos++
      } else {
        tablasVacias++
      }
    } catch (error) {
      console.log(`  ❌ ${tabla.padEnd(30)} ERROR: ${error.message}`)
      tablasConError++
    }
  }
  
  console.log('─────────────────────────────────────────')
  console.log(`  Total: ${TABLAS_REQUERIDAS.length} tablas`)
  console.log(`  🟢 Con datos: ${tablasConDatos}`)
  console.log(`  ⚪ Vacías: ${tablasVacias}`)
  console.log(`  ❌ Con error: ${tablasConError}`)
  console.log(`  📊 Total de registros: ${totalRegistros}`)
  
  return tablasConError === 0
}

// ═══════════════════════════════════════════════════════════════════
// VERIFICACIÓN DE MUESTRA DE DATOS
// ═══════════════════════════════════════════════════════════════════

async function verificarMuestraDatos() {
  console.log('\n📋 Muestra de datos migrados...')
  console.log('─────────────────────────────────────────')
  
  try {
    const { data: pacientes } = await querySupabase('pacientes', '?limit=3')
    console.log(`  👥 Pacientes (muestra):`)
    if (pacientes && pacientes.length > 0) {
      for (const p of pacientes) {
        console.log(`     • ${p.nombre} (${p.rut || 'sin rut'})`)
      }
    } else {
      console.log(`     (vacío)`)
    }
  } catch (error) {
    console.log(`  ❌ Error al leer pacientes: ${error.message}`)
  }
  
  try {
    const { data: citas } = await querySupabase('citas', '?limit=3')
    console.log(`  📅 Citas (muestra):`)
    if (citas && citas.length > 0) {
      for (const c of citas) {
        console.log(`     • ${c.paciente_nombre} - ${c.fecha} ${c.hora_inicio} (${c.estado})`)
      }
    } else {
      console.log(`     (vacío)`)
    }
  } catch (error) {
    console.log(`  ❌ Error al leer citas: ${error.message}`)
  }
  
  try {
    const { data: presupuestos } = await querySupabase('presupuestos', '?limit=3')
    console.log(`  💰 Presupuestos (muestra):`)
    if (presupuestos && presupuestos.length > 0) {
      for (const p of presupuestos) {
        console.log(`     • ${p.folio} - ${p.paciente_nombre} - $${p.monto_total}`)
      }
    } else {
      console.log(`     (vacío)`)
    }
  } catch (error) {
    console.log(`  ❌ Error al leer presupuestos: ${error.message}`)
  }
}

// ═══════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════

async function main() {
  console.log('═══════════════════════════════════════')
  console.log('🔍 F4-02e: Validación de migración Supabase')
  console.log('═══════════════════════════════════════')
  
  const tablasOk = await verificarTablas()
  await verificarMuestraDatos()
  
  console.log('\n═══════════════════════════════════════')
  if (tablasOk) {
    console.log('✅ Validación completada: todas las tablas responden')
  } else {
    console.log('⚠️  Algunas verificaciones fallaron')
  }
  console.log('═══════════════════════════════════════')
}

main().catch(error => {
  console.error('❌ Error en validación:', error)
  process.exit(1)
})
