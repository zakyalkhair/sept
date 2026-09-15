import { bgClass } from '../lib/colors.js'
import { ACCENTS } from '../lib/colors.js'
import { useReducedMotion } from '../hooks/useReducedMotion.js'

/* Lima lapisan warna aksen yang opacity-nya berdenyut bergiliran —
   menghasilkan wash lembut yang bergeser di atas krem. Murni CSS keyframes:
   auto-berhenti kalau tab tidak terlihat, tidak ada rAF. */
export default function LatarLebur() {
  const reduced = useReducedMotion()
  if (reduced) return null

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {ACCENTS.map((w, i) => (
        <div
          key={w}
          className={`latar-lebur absolute inset-0 ${bgClass(w)}`}
          style={{ animationDelay: `${i * -3.4}s` }}
        />
      ))}
    </div>
  )
}
