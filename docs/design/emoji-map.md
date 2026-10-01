# Mapa Emoji → Icono (F10-A6)

**Propósito:** roadmap curado para eliminar ~300 emojis de UI en F10-B/C,
reemplazándolos por iconos lucide-react consistentes o componentes del DS.

**Regla de oro:** un emoji NUNCA es iconografía de interfaz. Los estados
(🟢🟡) se expresan con `<Badge dot variant=...>`; las acciones y objetos
con iconos lucide; lo dental-específico con iconos custom SVG.

## Tabla de mapeo principal

| Emoji | Reemplazo | Tipo | Contexto de uso |
|---|---|---|---|
| ⚠️ | `AlertTriangle` | lucide | Advertencias, banners de cuidado |
| 🗑️ | `Trash2` | lucide | Eliminar, papelera de reciclaje |
| ✅ | `CheckCircle2` | lucide | Éxito, confirmado, completado |
| ❌ | `XCircle` | lucide | Error, rechazo, fallido |
| ✕ | `X` | lucide | Cerrar modales/paneles |
| 📄 | `FileText` | lucide | Documentos, archivos, folios |
| 🔍 | `Search` | lucide | Búsquedas, filtros |
| 📅 | `Calendar` | lucide | Agenda, fechas, citas |
| 🗓️ | `CalendarDays` | lucide | Vista mensual/semanal |
| ➕ | `Plus` | lucide | Crear, agregar item |
| 🩸 | `Droplets` | lucide | Anticoagulantes, hemostasia |
| 🪑 | `Armchair` | lucide | Sillones/boxes de atención |
| 📞 | `Phone` | lucide | Teléfono, contacto |
| 👤 | `User` | lucide | Paciente individual |
| 👥 | `Users` | lucide | Grupos, directorio |
| ⚡ | `Zap` | lucide | Modo express, acción rápida |
| 💉 | `Syringe` | lucide | Profilaxis, anestesia |
| 🧪 | `FlaskConical` | lucide | Laboratorio, exámenes |
| 💊 | `Pill` | lucide | Vademécum, fármacos |
| ⏰ | `Clock` | lucide | Horarios, duración |
| ⏱️ | `Timer` | lucide | Cronómetro, tiempos |
| ♻️ | `Recycle` | lucide | Restaurar desde papelera |
| 🖨️ | `Printer` | lucide | Imprimir documentos |
| ⬇️ | `Download` | lucide | Descargar adjuntos |
| ⬆️ | `Upload` | lucide | Subir adjuntos |
| ⛔ | `Ban` | lucide | Bloqueos de agenda |
| 🚫 | `Ban` | lucide | Prohibido, sin acceso |
| 🔄 | `RefreshCw` | lucide | Sincronizar, recargar |
| 📋 | `ClipboardList` | lucide | Listas clínicas, checklist |
| 📝 | `PenLine` | lucide | Editar, notas |
| ✉️ | `Mail` | lucide | Comunicaciones, mensajes |
| 💳 | `CreditCard` | lucide | Pagos |
| 🧾 | `Receipt` | lucide | Boletas, comprobantes |
| 💰 | `Wallet` | lucide | Finanzas, caja |
| 📊 | `BarChart3` | lucide | Reportes, métricas |
| ⚙️ | `Settings` | lucide | Configuración |
| 🚨 | `Siren` | lucide | Urgencias, GES |
| 🔔 | `Bell` | lucide | Notificaciones |
| 📌 | `Pin` | lucide | Fijar, destacar |
| 🔒 | `Lock` | lucide | Seguridad, sesión |
| 💡 | `Lightbulb` | lucide | Tips, ayuda contextual |
| 📁 | `Folder` | lucide | Archivos, carpetas |
| 🏥 | `Hospital` | lucide | Clínicas, derivaciones |
| ⭐ | `Star` | lucide | Favoritos, destaque |
| 🎯 | `Target` | lucide | Objetivos, metas |

## Casos especiales (NO son iconos lucide)

| Emoji | Reemplazo | Razón |
|---|---|---|
| 🟢 🟡 🔵 🔴 | `<Badge dot variant="success/warning/info/error">` | Son ESTADOS, no iconos. El DS ya tiene Badge (F10-A2) |
| 🦷 | `Tooth` (icono custom SVG en `src/components/icons/Tooth.jsx`) | Lucide no tiene diente; es central del dominio. Se crea en F10-B |
| ✅/❌ en documentos imprimibles | Decidir caso por caso con prueba de impresión | Contraste en print puede exigir mantenerlos |

## Reglas de migración (F10-B/C)

1. **Botones:** emoji + texto → `<Button icon={LucideIcon}>texto</Button>`
2. **Estados:** emoji suelto → `<Badge dot variant=...>`
3. **Headers de módulo:** emoji + título → `<PageHeader title=...>` (sin emoji)
4. **Empty states:** emoji gigante → `<EmptyState icon={LucideIcon}>`
5. **Placeholders:** "🔍 Buscar..." → `<Input icon={Search} placeholder="Buscar...">`
6. **Títulos de tabla/columna:** emoji → solo texto (el icono va en el header)
7. **Documentos imprimibles:** auditar contraste antes de reemplazar

## Anexo vivo

El inventario automático por módulo vive en `docs/design/emoji-inventory.md`
(regenerar con el script de F10-A6 antes de cada sprint de F10-C).
