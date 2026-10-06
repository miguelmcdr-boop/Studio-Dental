import { useState, useEffect, useRef, useCallback } from 'react'
import { createLogger } from '../../../../infrastructure/logging/logger'

const log = createLogger('useDictadoVoz')

// Interface para SpeechRecognition de Web Speech API
interface ISpeechRecognitionEvent {
  resultIndex: number
  results: {
    length: number
    [index: number]: {
      length: number
      [subIndex: number]: {
        transcript: string
      }
    }
  }
}

interface ISpeechRecognitionErrorEvent {
  error: string
  [key: string]: unknown
}

interface ISpeechRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: ISpeechRecognitionEvent) => void) | null
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort?: () => void
}

type SpeechRecognitionConstructor = new () => ISpeechRecognition

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

export interface UseDictadoVozReturn {
  escuchando: boolean
  textoDictado: string
  soporteNativo: boolean
  iniciarDictado: () => void
  detenerDictado: () => void
  limpiarDictado: () => void
}

export const useDictadoVoz = (): UseDictadoVozReturn => {
  const [escuchando, setEscuchando] = useState<boolean>(false)
  const [textoDictado, setTextoDictado] = useState<string>('')
  const [soporteNativo, setSoporteNativo] = useState<boolean>(false)
  const recognitionRef = useRef<ISpeechRecognition | null>(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setSoporteNativo(true)
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'es-CL' // Idioma español Chile / Latinoamérica

      recognition.onresult = (event: ISpeechRecognitionEvent) => {
        let transcripcionActual = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcripcionActual += event.results[i][0].transcript
        }
        setTextoDictado(transcripcionActual)
      }

      recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
        log.error('Error en reconocimiento de voz:', event.error)
        setEscuchando(false)
      }

      recognition.onend = () => {
        setEscuchando(false)
      }

      recognitionRef.current = recognition
    }
  }, [])

  const iniciarDictado = useCallback((): void => {
    if (recognitionRef.current && !escuchando) {
      setTextoDictado('')
      try {
        recognitionRef.current.start()
        setEscuchando(true)
      } catch (e) {
        log.error(e)
      }
    }
  }, [escuchando])

  const detenerDictado = useCallback((): void => {
    if (recognitionRef.current && escuchando) {
      try {
        recognitionRef.current.stop()
        setEscuchando(false)
      } catch (e) {
        log.error(e)
      }
    }
  }, [escuchando])

  const limpiarDictado = useCallback((): void => {
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
