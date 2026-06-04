'use client'

// Shown when the dump shows signs of crisis or self-harm. A calm tool for ages
// 13+ must not turn that into a task with a momentum meter. Care comes first;
// the list waits.

interface SupportCardProps {
  /** Present only when there are non-crisis items to return to. */
  onContinue?: () => void
  onReset: () => void
}

export function SupportCard({ onContinue, onReset }: SupportCardProps) {
  return (
    <section
      className="rise w-full max-w-md flex flex-col gap-6 text-center"
      aria-labelledby="support-heading"
    >
      <div
        aria-hidden
        className="mx-auto h-1.5 w-16 rounded-full bg-gradient-to-r from-accent to-accent-deep"
      />
      <h2 id="support-heading" className="font-display text-3xl text-ink">
        First, you.
      </h2>
      <p className="text-muted text-lg leading-relaxed">
        Some of what you wrote sounds heavy. Before any task, it is worth talking
        to someone. You deserve that.
      </p>

      <div className="flex flex-col gap-2 rounded-[1.5rem] bg-surface border border-line shadow-[var(--shadow-card)] px-6 py-6 text-left">
        <p className="text-ink font-medium">If you are in the US</p>
        <p className="text-muted">
          Call or text <span className="text-ink font-medium">988</span> (Suicide
          and Crisis Lifeline), any time.
        </p>
        <p className="text-muted">
          Or text <span className="text-ink font-medium">HOME</span> to{' '}
          <span className="text-ink font-medium">741741</span> (Crisis Text Line).
        </p>
        <p className="text-faint text-sm pt-1">
          Anywhere else:{' '}
          <a
            className="underline underline-offset-2 hover:text-ink"
            href="https://findahelpline.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            findahelpline.com
          </a>
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        {onContinue && (
          <button
            onClick={onContinue}
            className="rounded-full bg-accent px-7 py-4 text-base font-medium text-white shadow-[var(--shadow-soft)] transition hover:bg-accent-deep active:scale-[0.99]"
          >
            When you are ready, see your list
          </button>
        )}
        <button
          onClick={onReset}
          className="text-sm text-faint transition hover:text-ink"
        >
          Start over
        </button>
      </div>
    </section>
  )
}
