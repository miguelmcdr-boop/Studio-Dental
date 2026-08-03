import { useState, useCallback } from 'react'

export const useDictadoVoz = (onTextoDictado) => {
  const [escuchandoVoz, setEscuchandoVoz] = useState(false)

  const toggleDictadoVoz = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta el dictado por voz. Te recomendamos usar Google Chrome o Microsoft Edge.')
      return
    }

    if (escuchandoVoz) {
      setEscuchandoVoz(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'es-CL'
    recognition.continuous = true
    recognition.interimResults = false

    recognition.onstart = () => setEscuchandoVoz(true)
    recognition.onend = () => setEscuchandoVoz(false)
    recognition.onerror = () => setEscuchandoVoz(false)

    recognition.onresult = (event) => {
      const textoDictado = event.results[event.results.length - 1][0].transcript
      onTextoDictado(textoDictado)
    }

    recognition.start()
  }, [escuchandoVoz, onTextoDictado])

  return { escuchandoVoz, toggleDictadoVoz }
}