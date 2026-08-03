import React, { useState, useEffect, useRef } from 'react'

export const FirmaDigitalCanvas = ({ alGuardarFirma, alLimpiarFirma }) => {
  const canvasRef = useRef(null)
  const [dibujando, setDibujando] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.strokeStyle = '#000000'
    }
  }, [])

  const obtenerCoordenadas = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  const iniciarDibujo = (e) => {
    setDibujando(true)
    const { x, y } = obtenerCoordenadas(e)
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(x, y)
    }
  }

  const dibujar = (e) => {
    if (!dibujando) return
    e.preventDefault()
    const { x, y } = obtenerCoordenadas(e)
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) {
      ctx.lineTo(x, y)
      ctx.stroke()
    }
  }

  const detenerDibujo = () => {
    if (dibujando && canvasRef.current) {
      setDibujando(false)
      const dataUrl = canvasRef.current.toDataURL('image/png')
      if (alGuardarFirma) alGuardarFirma(dataUrl)
    }
  }

  const limpiarCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (alLimpiarFirma) alLimpiarFirma()
  }

  return (
    <div className="space-y-2">
      <div className="border-2 border-dashed border-gray-300 rounded-2xl p-1 bg-white inline-block">
        <canvas
          ref={canvasRef}
          width={380}
          height={140}
          className="cursor-crosshair touch-none bg-gray-50/50 rounded-xl"
          onMouseDown={iniciarDibujo}
          onMouseMove={dibujar}
          onMouseUp={detenerDibujo}
          onMouseLeave={detenerDibujo}
          onTouchStart={iniciarDibujo}
          onTouchMove={dibujar}
          onTouchEnd={detenerDibujo}
        />
      </div>
      <div>
        <button
          type="button"
          onClick={limpiarCanvas}
          className="text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1 rounded-lg"
        >
          🧹 Limpiar Firma
        </button>
      </div>
    </div>
  )
}