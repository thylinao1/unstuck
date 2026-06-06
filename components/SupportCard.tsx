'use client'

// Shown when the dump shows signs that someone could be harmed: self-harm, a
// threat to another person, abuse, or a medical emergency. A calm tool for ages
// 13+ must not turn that into a task with a momentum meter. Safety comes first;
// the list waits.

interface SupportCardProps {
  /** Present only when there are ordinary items to return to. */
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
        First, this.
      </h2>
      <p className="text-muted text-lg leading-relaxed">
        Some of what you wrote sounds serious. Before any task, please reach out.
        You deserve support, and so does anyone who might be at risk.
      </p>

      <div className="flex flex-col gap-4 rounded-[1.5rem] bg-surface border border-line shadow-[var(--shadow-card)] px-6 py-6 text-left">
        <div className="flex flex-col gap-1">
          <p className="text-ink font-medium">If anyone is in immediate danger</p>
          <p className="text-muted">
            Contact your local emergency services now. In the US, call{' '}
            <span className="text-ink font-medium">911</span>.
          </p>
        </div>
        <div className="flex flex-col gap-1 border-t border-line pt-4">
          <p className="text-ink font-medium">If you are struggling</p>
          <p className="text-muted">
            Call or text <span className="text-ink font-medium">988</span> (Suicide
            and Crisis Lifeline), any time. Or text{' '}
            <span className="text-ink font-medium">HOME</span> to{' '}
            <span className="text-ink font-medium">741741</span>.
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
