import { useEffect, useRef, useState } from 'react'
import { urlVideoPembuka } from '../data/video.js'

/* Video kecil di halaman pembuka.

   SELALU bisu: videonya sendiri tidak bersuara, dan lagu introlah yang
   jadi suaranya. Bisu juga syarat browser supaya video boleh berjalan
   sendiri tanpa diketuk. */
export default function VideoPembuka({ jalan }) {
  const src = urlVideoPembuka()
  const ref = useRef(null)
  const [gagal, setGagal] = useState(false)

  useEffect(() => {
    if (jalan) ref.current?.play().catch(() => {})
  }, [jalan])

  if (!src || gagal) return null

  return (
    <div className="w-[min(19rem,64vw)] overflow-hidden rounded-2xl shadow-[0_18px_40px_-18px_rgba(46,42,38,0.55)]">
      <video
        ref={ref}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        disablePictureInPicture
        onError={() => setGagal(true)}
        className="aspect-video w-full bg-ink/10 object-cover"
      />
    </div>
  )
}
