#!/usr/bin/env node
/**
 * Script de validación arquitectónica — F3-02
 * 
 * Verifica las reglas de la Constitución de Arquitectura (Cap. III y IV):
 * - Tamaño máximo de archivo por tipo (250 JSX, 150 hooks, 50 utils)
 * - Existencia de index.js por módulo (barrera pública)
 * - Cero export default en archivos internos (solo App.jsx permitido)
 * 
 * Los archivos en la allowlist están "congelados" en su tamaño actual:
 * no pueden crecer más hasta ser refactorizados.
 * 
 * Uso: node scripts/validate-architecture.js
 * Retorno: 0 si todo pasa, 1 si hay violaciones.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')
const SRC = path.join(ROOT, 'src')

// Cargar allowlist
const allowlistPath = path.join(__dirname, 'architecture-allowlist.json')
let allowlistConfig
try {
  allowlistConfig = JSON.parse(fs.readFileSync(allowlistPath, 'utf-8'))
} catch (e) {
  console.error('❌ Error al leer scripts/architecture-allowlist.json:', e.message)
  process.exit(1)
}

const LIMITS = allowlistConfig.limits
const ALLOWLIST = allowlistConfig.allowlist

const violations = []

// ─────────────────────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────────────────────

function contarLineas(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  return content.split('\n').length
}

function rutaRelativa(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/')
}

function listarArchivos(dir, extensiones, resultados = []) {
  if (!fs.existsSync(dir)) return resultados
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      // Excluir node_modules, dist, y carpetas ocultas
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) {
        continue
      }
      listarArchivos(fullPath, extensiones, resultados)
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name)
      if (extensiones.includes(ext) && !entry.name.endsWith('.test.js') && !entry.name.endsWith('.test.jsx')) {
        resultados.push(fullPath)
      }
    }
  }
  return resultados
}

function clasificarArchivo(filePath) {
  const rel = rutaRelativa(filePath)
  const nombre = path.basename(filePath)
  
  // App.jsx es el componente raíz (excepción permitida)
  if (rel === 'src/App.jsx') return { tipo: 'app', limite: Infinity }
  
  // Archivos JSX → componentes (máx 250 líneas)
  if (filePath.endsWith('.jsx')) return { tipo: 'jsx', limite: LIMITS.jsx }
  
  // Archivos use*.js → hooks (máx 150 líneas)
  if (nombre.startsWith('use') && filePath.endsWith('.js')) return { tipo: 'hook', limite: LIMITS.hooks }
  
  // Archivos en */utils/*.js → utils (máx 50 líneas)
  if (rel.includes('/utils/') && filePath.endsWith('.js')) return { tipo: 'utils', limite: LIMITS.utils }
  
  // Archivos en src/utils/*.js (raíz) → también utils
  if (rel.startsWith('src/utils/') && filePath.endsWith('.js')) return { tipo: 'utils', limite: LIMITS.utils }
  
  // Otros archivos JS (services, schemas, constants, stores) → no sujetos a límite
  return { tipo: 'otro', limite: Infinity }
}

// ─────────────────────────────────────────────────────────────
// Regla 1: Tamaño máximo de archivos
// ─────────────────────────────────────────────────────────────

function verificarTamanos() {
  const archivos = listarArchivos(SRC, ['.jsx', '.js'])
  
  for (const archivo of archivos) {
    const rel = rutaRelativa(archivo)
    const { tipo, limite } = clasificarArchivo(archivo)
    
    // No verificar tipos sin límite (services, schemas, etc.)
    if (limite === Infinity && !ALLOWLIST[rel]) continue
    
    const lineas = contarLineas(archivo)
    
    if (ALLOWLIST[rel]) {
      // Archivo en allowlist: verificar que no crezca más allá de su tamaño congelado
      const limiteCongelado = ALLOWLIST[rel]
      if (lineas > limiteCongelado) {
        violations.push(
          `📏 [ALLOWLIST EXCEDIDA] ${rel}\n` +
          `   Tipo: ${tipo} | Líneas: ${lineas} (límite congelado: ${limiteCongelado})\n` +
          `   Este archivo está en la allowlist y no puede crecer más.\n` +
          `   Refactorízalo o divide su contenido antes de agregar más código.`
        )
      }
    } else {
      // Archivo no en allowlist: verificar contra el límite constitucional
      if (lineas > limite) {
        violations.push(
          `📏 [LÍMITE EXCEDIDO] ${rel}\n` +
          `   Tipo: ${tipo} | Líneas: ${lineas} (límite: ${limite})\n` +
          `   Refactoriza el archivo o agrégalo a la allowlist si es un caso especial.`
        )
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Regla 2: Existencia de index.js por módulo (barrera pública)
// ─────────────────────────────────────────────────────────────

function verificarBarrerasPublicas() {
  const modulesDir = path.join(SRC, 'modules')
  if (!fs.existsSync(modulesDir)) {
    violations.push('📁 [ESTRUCTURA] No existe el directorio src/modules/')
    return
  }
  
  const entries = fs.readdirSync(modulesDir, { withFileTypes: true })
  const modulos = entries.filter(e => e.isDirectory() && !e.name.startsWith('.'))
  
  for (const modulo of modulos) {
    const indexPath = path.join(modulesDir, modulo.name, 'index.js')
    if (!fs.existsSync(indexPath)) {
      violations.push(
        `📁 [BARRERA PÚBLICA FALTANTE] src/modules/${modulo.name}/\n` +
        `   Este módulo no tiene index.js.\n` +
        `   Crea un index.js que exporte la barrera pública del módulo (Cap. III).`
      )
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Regla 3: Cero export default fuera de App.jsx
// ─────────────────────────────────────────────────────────────

function verificarExportDefault() {
  const archivos = listarArchivos(SRC, ['.jsx', '.js'])
  
  for (const archivo of archivos) {
    const rel = rutaRelativa(archivo)
    
    // App.jsx es la única excepción permitida
    if (rel === 'src/App.jsx') continue
    
    const content = fs.readFileSync(archivo, 'utf-8')
    
    // Buscar 'export default' (con posibles variaciones de espaciado)
    if (/export\s+default/.test(content)) {
      violations.push(
        `🚫 [EXPORT DEFAULT PROHIBIDO] ${rel}\n` +
        `   Solo App.jsx puede usar 'export default'.\n` +
        `   Usa exportaciones nombradas: 'export const X = ...' o 'export function X() ...'`
      )
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Ejecución
// ─────────────────────────────────────────────────────────────

console.log('🏛️  Validación Arquitectónica — Studio Dental (F3-02)')
console.log('═══════════════════════════════════════════════════════════')
console.log(`Límites constitucionales: JSX ≤${LIMITS.jsx} | Hooks ≤${LIMITS.hooks} | Utils ≤${LIMITS.utils}`)
console.log(`Archivos en allowlist: ${Object.keys(ALLOWLIST).length}`)
console.log('')

verificarTamanos()
verificarBarrerasPublicas()
verificarExportDefault()

if (violations.length === 0) {
  console.log('✅ Todas las reglas arquitectónicas se cumplen.')
  console.log('')
  process.exit(0)
} else {
  console.log(`❌ Se encontraron ${violations.length} violación(es) arquitectónica(s):\n`)
  violations.forEach((v, i) => {
    console.log(`${i + 1}. ${v}\n`)
  })
  console.log('═══════════════════════════════════════════════════════════')
  console.log('Corrige las violaciones antes de continuar.')
  console.log('Documentación: Cap. III y IV de la Constitución de Arquitectura.')
  process.exit(1)
}