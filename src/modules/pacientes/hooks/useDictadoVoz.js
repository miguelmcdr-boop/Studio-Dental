import { useState, useEffect, useRef, useCallback } from 'react'

export const useDictadoVoz = () => {
  const [escuchando, setEscuchando] = useState(false)
  const [textoDictado, setTextoDictado] = useState('')
  const [soporteNativo, setSoporteNativo] = useState(false)
  const recognitionRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setSoporteNativo(true)
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'es-CL' // Idioma español Chile / Latinoamérica

      recognition.onresult = (event) => {
        let transcripcionActual = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcripcionActual += event.results[i][0].transcript
        }
        setTextoDictado(transcripcionActual)
      }

      recognition.onerror = (event) => {
        console.error('Error en reconocimiento de voz:', event.error)
        setEscuchando(false)
      }

      recognition.onend = () => {
        setEscuchando(false)
      }

      recognitionRef.current = recognition
    }
  }, [])

  const iniciarDictado = useCallback(() => {
    if (recognitionRef.current && !escuchando) {
      setTextoDictado('')
      try {
        recognitionRef.current.start()
        setEscuchando(true)
      } catch (e) {
        console.error(e)
      }
    }
  }, [escuchando])

  const detenerDictado = useCallback(() => {
    if (recognitionRef.current && escuchando) {
      try {
        recognitionRef.current.stop()
        setEscuchando(false)
      } catch (e) {
        console.error(e)
      }
    }
  }, [escuchando])

  const limpiarDictado = useCallback(() => {
    setTextoDictado('')
  }, [])

  return {
    escuchando,
    textoDictado,
    soporteNativo,
    iniciarDictado,
    detenerDictado,
    limpiarDictado
  }
}