import React from 'react'
import { DentikOSLogo } from './brand/DentikOSLogo'
import { CheckCircle2, ShieldCheck, Sparkles, Activity } from 'lucide-react'

export const LoginBrandBanner: React.FC = () => {
  return (
    <div className="relative flex-1 bg-gradient-to-br from-[#050914] via-[#091122] to-[#04070F] p-8 lg:p-12 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-[#1E293B]">
      {/* Patrón de fondo geométrico sutil */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(212, 175, 55, 0.25) 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />

      {/* Halo de luz ámbar/oro sutil */}
      <div
        className="absolute -top-24 -left-24 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 space-y-6">
        <DentikOSLogo variant="stacked" size="lg" opticalSize="display" dark={true} />

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#1E293B]/70 border border-[#D4AF37]/30 text-[#E5C378] text-xs font-medium tracking-wide">
            <Sparkles size={13} className="text-[#D4AF37]" />
            <span>DentikOS Precision Platform</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
            El sistema operativo de la <span className="bg-gradient-to-r from-[#FFF5DF] via-[#E5C378] to-[#D4AF37] bg-clip-text text-transparent">odontología de precisión</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-md leading-relaxed">
            Gestión clínica integral, aranceles transparentes y soberanía digital diseñados para prácticas de excelencia.
          </p>
        </div>

        {/* Pilares clínicos con checks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0F172A]/70 border border-[#1E293B]/80 text-slate-300 text-xs sm:text-sm font-medium">
            <CheckCircle2 size={16} className="text-[#D4AF37] shrink-0" />
            <span>Ficha clínica integrada</span>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0F172A]/70 border border-[#1E293B]/80 text-slate-300 text-xs sm:text-sm font-medium">
            <CheckCircle2 size={16} className="text-[#D4AF37] shrink-0" />
            <span>Agenda médica inteligente</span>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0F172A]/70 border border-[#1E293B]/80 text-slate-300 text-xs sm:text-sm font-medium">
            <CheckCircle2 size={16} className="text-[#D4AF37] shrink-0" />
            <span>Facturación y aranceles</span>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0F172A]/70 border border-[#1E293B]/80 text-slate-300 text-xs sm:text-sm font-medium">
            <CheckCircle2 size={16} className="text-[#D4AF37] shrink-0" />
            <span>Control de inventario</span>
          </div>
        </div>
      </div>

      {/* Sello de seguridad y cumplimiento */}
      <div className="relative z-10 pt-8 mt-6 border-t border-[#1E293B]/80 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-[#D4AF37]" />
          <span>Ley 19.628 · Privacidad y Aislamiento Clínico</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Activity size={12} className="text-emerald-400" />
          <span>Disponibilidad 99.9%</span>
        </div>
      </div>
    </div>
  )
}
