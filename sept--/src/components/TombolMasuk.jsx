import Tombol from './Tombol.jsx'
import { useMusic } from '../lib/MusicContext.jsx'
import { useTransisi } from '../lib/TransisiContext.jsx'

export default function TombolMasuk({ onMasuk }) {
  const { nyalakan } = useMusic()
  const { mulai } = useTransisi()

  const masuk = (e) => {
    /* play() harus di dalam gestur — panggil dulu, jangan di-await. */
    onMasuk?.()
    nyalakan()
    const r = e.currentTarget.getBoundingClientRect()
    mulai('/pesan', r.left + r.width / 2, r.top + r.height / 2)
  }

  return (
    <Tombol
      onClick={masuk}
      kuat={0.4}
      radius={140}
      data-kursor-teks="masuk!"
      className="border border-line bg-ink px-8 py-4 text-bg"
    >
      masuk
    </Tombol>
  )
}
