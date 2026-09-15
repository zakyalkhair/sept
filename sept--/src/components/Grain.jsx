/* Butir kertas statis. SVG feTurbulence sebagai data-URI, fixed, sangat samar.
   Tidak ada gerak, tidak ada rAF — cuma tekstur supaya krem terasa kertas.

   Blending NORMAL, bukan `mix-blend-multiply`. Overlay blend selebar layar
   memaksa browser membaca-balik latar di bawahnya tiap kali ada yang
   bergerak — mahal, dan di sini tidak dibayar apa-apa: di atas krem terang,
   noise abu 9% lewat multiply dan lewat alpha biasa nyaris tak terbedakan. */
const NOISE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"

export default function Grain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[3] opacity-[0.085]"
      style={{ backgroundImage: `url("${NOISE}")`, backgroundSize: '140px 140px' }}
    />
  )
}
