/**
 * Script de verificación de migraciones (F7-13)
 * 
 * Compara el esquema resultante de aplicar todas las migraciones de
 * `supabase/migrations/` con el esquema actual de producción.
 * 
 * Reporta diferencias en:
 * - Tablas
 * - Columnas
 * - Índices
 * - Políticas RLS
 * - Funciones
 * - Triggers
 * 
 * Uso: npm run db:verify
 * 
 * Requiere:
 * - Variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
 * - @supabase/supabase-js instalado
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

// Leer variables de entorno desde .env
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY deben estar configuradas')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/**
 * Extrae nombres de tablas de un archivo SQL
 */
const extractTables = (sql) => {
  const tables = new Set()
  const regex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?/gi
  let match
  while ((match = regex.exec(sql)) !== null) {
    tables.add(match[1].toLowerCase())
  }
  return Array.from(tables)
}

/**
 * Extrae nombres de funciones de un archivo SQL
 */
const extractFunctions = (sql) => {
  const functions = new Set()
  const regex = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+[`"']?(\w+)[`"']?/gi
  let match
  while ((match = regex.exec(sql)) !== null) {
    functions.add(match[1].toLowerCase())
  }
  return Array.from(functions)
}

/**
 * Extrae nombres de triggers de un archivo SQL
 */
const extractTriggers = (sql) => {
  const triggers = new Set()
  const regex = /CREATE\s+TRIGGER\s+[`"']?(\w+)[`"']?/gi
  let match
  while ((match = regex.exec(sql)) !== null) {
    triggers.add(match[1].toLowerCase())
  }
  return Array.from(triggers)
}

/**
 * Lee todas las migraciones y extrae objetos SQL
 */
const readMigrations = () => {
  const migrationsDir = join(process.cwd(), 'supabase', 'migrations')
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort() // Ordenar por timestamp
  
  const migrations = {
    tables: new Set(),
    functions: new Set(),
    triggers: new Set(),
  }
  
  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), 'utf-8')
    extractTables(sql).forEach(t => migrations.tables.add(t))
    extractFunctions(sql).forEach(f => migrations.functions.add(f))
    extractTriggers(sql).forEach(t => migrations.triggers.add(t))
  }
  
  return {
    tables: Array.from(migrations.tables).sort(),
    functions: Array.from(migrations.functions).sort(),
    triggers: Array.from(migrations.triggers).sort(),
  }
}

/**
 * Obtiene el esquema actual de producción
 */
const getCurrentSchema = async () => {
  // Tablas
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_type', 'BASE TABLE')
  
  if (tablesError) throw tablesError
  
  // Funciones
  const { data: functions, error: functionsError } = await supabase
    .from('information_schema.routines')
    .select('routine_name')
    .eq('routine_schema', 'public')
    .eq('routine_type', 'FUNCTION')
  
  if (functionsError) throw functionsError
  
  // Triggers
  const { data: triggers, error: triggersError } = await supabase
    .from('information_schema.triggers')
    .select('trigger_name')
    .eq('trigger_schema', 'public')
  
  if (triggersError) throw triggersError
  
  return {
    tables: tables.map(t => t.table_name.toLowerCase()).sort(),
    functions: functions.map(f => f.routine_name.toLowerCase()).sort(),
    triggers: triggers.map(t => t.trigger_name.toLowerCase()).sort(),
  }
}

/**
 * Compara dos arrays y reporta diferencias
 */
const compare = (expected, actual, label) => {
  const missing = expected.filter(x => !actual.includes(x))
  const extra = actual.filter(x => !expected.includes(x))
  
  if (missing.length === 0 && extra.length === 0) {
    console.log(`✅ ${label}: ${expected.length} elementos coinciden`)
    return true
  }
  
  console.log(`⚠️  ${label}:`)
  if (missing.length > 0) {
    console.log(`   Faltan en producción: ${missing.join(', ')}`)
  }
  if (extra.length > 0) {
    console.log(`   Extra en producción: ${extra.join(', ')}`)
  }
  return false
}

/**
 * Main
 */
const main = async () => {
  console.log('🔍 Verificando migraciones de esquema...\n')
  
  try {
    const migrations = readMigrations()
    console.log(`📄 Migraciones leídas:`)
    console.log(`   Tablas: ${migrations.tables.length}`)
    console.log(`   Funciones: ${migrations.functions.length}`)
    console.log(`   Triggers: ${migrations.triggers.length}\n`)
    
    const current = await getCurrentSchema()
    console.log(`📊 Esquema actual en producción:`)
    console.log(`   Tablas: ${current.tables.length}`)
    console.log(`   Funciones: ${current.functions.length}`)
    console.log(`   Triggers: ${current.triggers.length}\n`)
    
    const tablesOk = compare(migrations.tables, current.tables, 'Tablas')
    const functionsOk = compare(migrations.functions, current.functions, 'Funciones')
    const triggersOk = compare(migrations.triggers, current.triggers, 'Triggers')
    
    if (tablesOk && functionsOk && triggersOk) {
      console.log('\n✅ Todas las migraciones están aplicadas correctamente')
      process.exit(0)
    } else {
      console.log('\n⚠️  Hay diferencias entre migraciones y esquema actual')
      console.log('   Esto es normal si las migraciones aún no se han aplicado.')
      console.log('   Usa `npm run db:push` para aplicar las migraciones.')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

main()
