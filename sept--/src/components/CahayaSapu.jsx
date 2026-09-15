/* Sorot hangat besar yang melayang sangat pelan di belakang isi halaman.
   Murni CSS keyframe — browser menjeda sendiri saat tab tak terlihat.
   Di prefers-reduced-motion animasinya mati (parkir di tengah). */
export default function CahayaSapu() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="cahaya-sapu absolute left-1/2 top-1/2 h-[90vmax] w-[90vmax] rounded-full" />
    </div>
  )
}
