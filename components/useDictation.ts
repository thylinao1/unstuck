'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Voice input for the brain dump via the browser's built-in Web Speech API.
// No backend, no API cost: recognition runs in the browser. Additive: typing
// always works, and the mic simply does not appear where the API is unsupported
// (e.g. Firefox), so nothing breaks.
//
// Safari is the tricky one. Its webkitSpeechRecognition ENDS after each short
// utterance or pause (it largely ignores `continuous`), firing `onend`. The old
// version set listening=false there, so after the first pause it stopped and, to
// the user, "the button did nothing." The fix: while the user still wants to
// listen, restart on `onend`. We also surface permission/device errors instead
// of failing silently, and guard start() (Safari throws if already started).

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
  /** A user-facing message when the mic could not be used (e.g. permission). */
  error: string | null
  toggle: () => void
  stop: () => void
}

export function useDictation(onFinal: (text: string) => void): Dictation {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const wantRef = useRef(false) // the user intends to be listening
  const restartGuardRef = useRef(0) // consecutive instant ends -> bail out
  const beginRef = useRef<() => void>(() => {})
  const onFinalRef = useRef(onFinal)

  useEffect(() => {
    onFinalRef.current = onFinal
  }, [onFinal])

  useEffect(() => {
    // Client-only capability check, after mount so SSR and first paint agree.
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setSupported(getRecognitionCtor() !== null)
    return () => {
      wantRef.current = false
      recognitionRef.current?.abort()
    }
  }, [])

  const begin = useCallback(() => {
    const Ctor = getRecognitionCtor()
    if (!Ctor) return
    let recognition: SpeechRecognitionLike
    try {
      recognition = new Ctor()
    } catch {
      return
    }
    recognition.lang = (typeof navigator !== 'undefined' && navigator.language) || 'en-US'
    recognition.continuous = true
    recognition.interimResults = true
    const startedAt = Date.now()

    recognition.onresult = (event) => {
      restartGuardRef.current = 0 // a healthy session is producing results
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

    recognition.onerror = (event) => {
      // Permission / device problems are fatal: stop and tell the user, so the
      // mic never just sits there doing nothing. Transient errors (no-speech,
      // aborted, network) fall through to onend, which restarts.
      if (
        event.error === 'not-allowed' ||
        event.error === 'service-not-allowed' ||
        event.error === 'audio-capture'
      ) {
        wantRef.current = false
        setListening(false)
        setInterim('')
        setError(
          event.error === 'audio-capture'
            ? 'No microphone found. You can type instead.'
            : 'Microphone access is blocked. Allow it for this site, then tap Speak again.',
        )
      }
    }

    recognition.onend = () => {
      setInterim('')
      if (!wantRef.current) {
        setListening(false)
        return
      }
      // Safari ends after each phrase; keep going while the user wants to listen.
      // If it keeps ending instantly it is failing, not pausing, so bail out.
      const endedInstantly = Date.now() - startedAt < 250
      restartGuardRef.current = endedInstantly ? restartGuardRef.current + 1 : 0
      if (restartGuardRef.current >= 4) {
        wantRef.current = false
        setListening(false)
        return
      }
      beginRef.current()
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
      setListening(true)
      setError(null)
    } catch {
      // Safari throws InvalidStateError if start() races a not-yet-ended session.
    }
  }, [])

  useEffect(() => {
    beginRef.current = begin
  }, [begin])

  const start = useCallback(() => {
    wantRef.current = true
    restartGuardRef.current = 0
    setError(null)
    beginRef.current()
  }, [])

  const stop = useCallback(() => {
    wantRef.current = false
    recognitionRef.current?.stop()
    setListening(false)
    setInterim('')
  }, [])

  const toggle = useCallback(() => {
    if (wantRef.current) stop()
    else start()
  }, [start, stop])

  return { supported, listening, interim, error, toggle, stop }
}
