/* Latar /pesan: taplak gingham lembut (warna coral situs) + vignette hangat.
   Dibuat dengan CSS, bukan gambar — skala & opacity bebas diatur.
   Statis, tanpa gerak, di bawah kartu. */
export default function Vignette() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background: [
          /* vignette: tepi lebih gelap, tengah terang */
          'radial-gradient(ellipse 120% 100% at 50% 40%, transparent 32%, rgba(46,42,38,0.05) 70%, rgba(46,42,38,0.13) 100%)',
          /* gingham: dua set garis coral semi-transparan yang bersilangan */
          'repeating-linear-gradient(0deg, transparent 0 48px, rgba(255,122,89,0.2) 48px 96px)',
          'repeating-linear-gradient(90deg, transparent 0 48px, rgba(255,122,89,0.2) 48px 96px)',
          'var(--color-bg)',
        ].join(', '),
      }}
    />
  )
}
