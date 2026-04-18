import { Monitor, Smartphone, ArrowRight } from 'lucide-react'

export default function MobileBlock() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-10 text-text-primary">
      <div className="hero-glow left-1/2 top-1/3 -translate-x-1/2" />
      <div className="hero-noise" />

      <div className="relative z-10 w-full max-w-md text-center">
        <p className="mb-6 font-mono text-[0.7rem] uppercase tracking-[0.22em] text-accent">
          Desktop only
        </p>

        <div className="mb-8 flex items-center justify-center gap-4 text-text-muted">
          <div className="relative">
            <Smartphone className="h-10 w-10" strokeWidth={1.25} />
            <span
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="block h-[2px] w-12 rotate-45 rounded-full bg-accent" />
            </span>
          </div>
          <ArrowRight className="h-4 w-4" />
          <Monitor className="h-10 w-10 text-text-primary" strokeWidth={1.25} />
        </div>

        <h1 className="mb-4 font-display text-4xl leading-tight tracking-tight text-text-primary">
          Best on a bigger screen
        </h1>

        <p className="mb-8 font-body text-[0.95rem] leading-relaxed text-text-secondary">
          The resume builder is a two-pane workspace — editor on one side,
          live preview on the other. It needs real estate that phones and
          tablets can't give it. Switch to a desktop or laptop and pick up
          right where you left off.
        </p>

        <div className="mx-auto flex max-w-xs flex-col gap-3 border-t border-border pt-6 text-left">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-text-muted">
              01
            </span>
            <span className="text-sm text-text-secondary">
              Open this URL on a laptop or desktop
            </span>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-text-muted">
              02
            </span>
            <span className="text-sm text-text-secondary">
              Sign in — your work is synced and waiting
            </span>
          </div>
        </div>
      </div>

      <p className="relative z-10 mt-10 font-mono text-[0.6rem] uppercase tracking-[0.24em] text-text-muted">
        Resume Builder
      </p>
    </div>
  )
}
