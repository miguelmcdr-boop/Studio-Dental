/**
 * Constantes Financieras y de Convenios
 */

export const TIPOS_CONVENIO = [
  { id: 'particular', nombre: 'Particular (100% Base)', descuentoDefecto: 0 },
  { id: 'fonasa_a_b', nombre: 'Fonasa Tramos A/B', descuentoDefecto: 30 },
  { id: 'fonasa_c_d', nombre: 'Fonasa Tramos C/D', descuentoDefecto: 20 },
  { id: 'isapre_banmédica', nombre: 'Isapre Banmédica / Vida Tres', descuentoDefecto: 15 },
  { id: 'isapre_colmena', nombre: 'Isapre Colmena / Consalud', descuentoDefecto: 15 },
  { id: 'convenio_empresa', nombre: 'Convenio Institucional / Empresa', descuentoDefecto: 25 }
]

export const PORCENTAJES_LIQUIDACION = [
  { valor: 40, label: '40% Especialista / 60% Clínica' },
  { valor: 50, label: '50% Especialista / 50% Clínica' },
  { valor: 60, label: '60% Especialista / 40% Clínica' },
  { valor: 70, label: '70% Especialista / 30% Clínica' }
]