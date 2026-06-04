'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Voice input for the brain dump via the browser's built-in Web Speech API.
// No backend, no API cost — recognition runs in the browser. Additive: typing
// always works, and the mic simply does not appear where the API is unsupported
// (e.g. Firefox), so nothing breaks.

interface SRAlternative {
  transcript: string
}
interface SRResult {
  readonly length: number
  isFinal: boolean
  [index: number]: SRAlternative
}
interface SRResultList {
  readonly length: number
  [index: number]: SRResult
}
interface SREvent {
  resultIndex: number
  results: SRResultList
}
interface SRErrorEvent {
  error: string
}
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SREvent) => void) | null
  onerror: ((event: SRErrorEvent) => void) | null
  onend: (() => void) | null
}
type SRConstructor = new () => SpeechRecognitionLike

function getRecognitionCtor(): SRConstructor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SRConstructor
    webkitSpeechRecognition?: SRConstructor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export interface Dictation {
  /** Whether the browser supports voice input at all. */
  supported: boolean
  listening: boolean
  /** The not-yet-final phrase, for a live preview. */
  interim: string
  toggle: () => void
  stop: () => void
}

export function useDictation(onFinal: (text: string) => void): Dictation {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const onFinalRef = useRef(onFinal)

  useEffect(() => {
    onFinalRef.current = onFinal
  }, [onFinal])

  useEffect(() => {
    // Client-only capability check, intentionally after mount so the server and
    // first client render agree (the mic must not cause a hydration mismatch).
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setSupported(getRecognitionCtor() !== null)
    return () => {
      recognitionRef.current?.abort()
    }
  }, [])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
    setInterim('')
  }, [])

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor()
    if (!Ctor) return
    const recognition = new Ctor()
    recognition.lang = (typeof navigator !== 'undefined' && navigator.language) || 'en-US'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event) => {
      let finalText = ''
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        const phrase = result[0]?.transcript ?? ''
        if (result.isFinal) finalText += phrase
        else interimText += phrase
      }
      if (finalText.trim()) {
        onFinalRef.current(finalText.trim())
        setInterim('')
      } else {
        setInterim(interimText)
      }
    }
    recognition.onerror = () => {
      setListening(false)
      setInterim('')
    }
    recognition.onend = () => {
      setListening(false)
      setInterim('')
    }

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }, [])

  const toggle = useCallback(() => {
    if (listening) stop()
    else start()
  }, [listening, start, stop])

  return { supported, listening, interim, toggle, stop }
}
