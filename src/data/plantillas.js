export const INDICACIONES_POST_OPERATORIAS = [
  { tipo: 'Exodoncia y Cirugía Oral', texto: '1. Morder y comprimir la gasa en la zona quirúrgica durante 30 a 45 minutos.\n2. No escupir, no realizar buches ni utilizar bombilla por las primeras 24 horas.\n3. Aplicar frío local sobre la mejilla (15 min aplicación / 15 min descanso) las primeras 12 horas.\n4. Dieta blanda y fría durante las primeras 24 horas.\n5. Evitar exposición al sol, calor directo y ejercicio físico intenso por 3 a 5 días.\n6. Tomar los analgésicos y antibióticos según la receta médica entregada.' },
  { tipo: 'Tratamiento de Endodoncia', texto: '1. Es normal sentir sensibilidad o molestia leve al morder durante los primeros 3 a 5 días post-atención.\n2. Evitar masticar alimentos duros o pegajosos sobre la pieza tratada mientras tenga la restauración provisoria.\n3. Tomar los analgésicos indicados si presenta molestia espontánea.\n4. Acudir a su hora agendada para la restauración definitiva de la pieza.' },
  { tipo: 'Limpieza y Destartraje Periodontal', texto: '1. Es posible experimentar ligera sensibilidad térmica (frío/calor) las primeras 48 horas.\n2. Mantener un cepillado suave con cepillo de cerdas blandas e hilo dental.\n3. Realizar colutorios con Clorhexidina 0.12% según la indicación de su dentista.\n4. Evitar alimentos con colorantes intensos o tabaco en las primeras 24 horas.' }
]

export const PATOLOGIAS_GES = [
  { id: 'ges_60', nombre: 'Salud Oral Integral del Adulto de 60 años', norma: 'Garantía de Acceso para todo beneficiario de 60 años de edad.' },
  { id: 'ges_embarazada', nombre: 'Salud Oral Integral de la Embarazada', norma: 'Garantía de Acceso desde la confirmación del embarazo hasta 9 meses postparto.' },
  { id: 'ges_6', nombre: 'Salud Oral Integral de Niñas y Niños de 6 años', norma: 'Garantía de Acceso para todo beneficiario a los 6 años cumplidos.' },
  { id: 'ges_urgencia', nombre: 'Urgencia Odontológica Ambulatoria', norma: 'Atención inmediata de cuadros agudos infecto-inflamatorios y traumáticos.' }
]

export const DIAGNOSTICOS_URGENCIA_SUGERIDOS = [
  'Pulpitis irreversible aguda (K04.0)',
  'Periodontitis apical aguda de origen pulpar (K04.4)',
  'Absceso periapical con flemón/celulitis (K04.7)',
  'Pericoronaritis aguda molar/tercer molar (K05.2)',
  'Traumatismo alvéolo-dentario [TAD] Avulsión/Subluxación (S02.5)',
  'Alveolitis osteolítica post-exodoncia (K10.3)'
]

export const TRATAMIENTOS_URGENCIA_SUGERIDOS = [
  'Pulpectomía de emergencia e irrigación antiséptica',
  'Apertura cameral y destartraje de urgencia',
  'Drenaje quirúrgico de absceso e irrigación con suero',
  'Exodoncia resolutiva por pieza no restaurable',
  'Curetaje, lavado alveolar y colocación de cura antiséptica'
]

export const DIAGNOSTICOS_CIE10 = [
  'Caries de la dentina (K02.1)',
  'Caries del esmalte (K02.0)',
  'Pulpitis reversible (K04.0)',
  'Pulpitis irreversible (K04.0)',
  'Necrosis de la pulpa (K04.1)',
  'Periodontitis apical aguda de origen pulpar (K04.4)',
  'Gingivitis marginal asociada a placa (K05.0)',
  'Periodontitis crónica localizada (K05.3)',
  'Pericoronaritis aguda (K05.2)',
  'Bruxismo y desgaste dentario por atrición (F45.8)',
  'Diente incluido / retenido (K01.1)',
  'Alveolitis osteolítica (K10.3)'
]

export const PLANTILLAS_EVOLUCION = [
  { clave: 'Anestesia', texto: 'Anestesia infiltrativa local con Mepivacaína 3% sin vasoconstrictor (1 tubo). Procedimiento realizado sin complicaciones.' },
  { clave: 'Obturación', texto: 'Eliminación completa de tejido cariado, grabado ácido selectivo 15s, adhesivo monocomponente, restauración con resina compuesta fotocurada por capas. Ajuste oclusal y pulido.' },
  { clave: 'Endodoncia', texto: 'Aislamiento absoluto con dique de goma, acceso cameral, conductometría electrónica, preparación biomecánica mecanizada e irrigación con Hipoclorito de Sodio 2.5%. Cura antiséptica y sellado provisorio.' },
  { clave: 'Exodoncia', texto: 'Sindesmotomía, luxación con elevador y tracción con fórceps. Curetaje alveolar, lavado con suero fisiológico, hemostasia por compresión y sutura.' },
  { clave: 'Limpieza', texto: 'Destartraje supragingival ultrasónico, remoción de cálculo interdental manual y profilaxis coronaria con pasta fluorada abrasiva suave.' }
]