import { useEffect, useRef, useState } from 'react'
import { PROMO_COPY } from '@/lib/copy'
import { PROMO_URL } from '@/lib/promo'

/**
 * Gameplayce promo, variant A (gameplayce.io#1348): an in-flow strip under the hero.
 * Not fixed, not floating, not a dialog — it covers nothing, never takes
 * focus and is not announced. One × (or Esc inside it) hides it for 90 days;
 * following the link hides it for good. Rules: lib/promo.ts.
 */
export function PromoStrip({ onDismiss, onClick }: { onDismiss: () => void; onClick: () => void }) {
  const ref = useRef<HTMLElement>(null)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setEntered(true))
    return () => window.cancelAnimationFrame(id)
  }, [])

  return (
    <aside
      ref={ref}
      aria-label={PROMO_COPY.label}
      data-testid="promo-strip"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onDismiss()
      }}
      className={`promo-strip relative mx-auto max-w-[680px] bg-card text-card-foreground border-2 border-border rounded-2xl p-4 pr-12 flex gap-3 items-start md:items-center text-left transition-[opacity,transform] duration-200 motion-reduce:transition-none ${entered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}`}
    >
      <div
        aria-hidden="true"
        className="shrink-0 w-11 h-11 rounded-xl grid place-items-center text-xl"
        style={{ background: 'linear-gradient(135deg, oklch(0.75 0.15 15), oklch(0.85 0.15 95))' }}
      >
        ✨
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-secondary mb-0.5">
          <span className="md:hidden">{PROMO_COPY.eyebrowShort}</span>
          <span className="hidden md:inline">{PROMO_COPY.eyebrow}</span>
        </p>
        <p className="text-lg font-semibold leading-tight" style={{ fontFamily: "'Fredoka', sans-serif" }}>
          {PROMO_COPY.title}
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">{PROMO_COPY.body}</p>
        <a
          href={PROMO_URL}
          target="_blank"
          rel="noopener"
          onClick={onClick}
          data-testid="promo-cta-mobile"
          className="md:hidden inline-flex items-center min-h-11 font-bold text-primary rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/60"
        >
          {PROMO_COPY.cta}
        </a>
      </div>
      <a
        href={PROMO_URL}
        target="_blank"
        rel="noopener"
        onClick={onClick}
        data-testid="promo-cta"
        className="hidden md:inline-flex shrink-0 items-center h-11 px-4 rounded-xl bg-primary text-primary-foreground font-semibold whitespace-nowrap focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/60"
      >
        {PROMO_COPY.cta}
      </a>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={PROMO_COPY.dismiss}
        data-testid="promo-dismiss"
        className="absolute top-1 right-1 w-11 h-11 grid place-items-center rounded-xl text-muted-foreground text-2xl hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/60"
      >
        ×
      </button>
    </aside>
  )
}
