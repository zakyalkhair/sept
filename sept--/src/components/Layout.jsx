import { MusicProvider } from '../lib/MusicContext.jsx'
import { TransisiProvider } from '../lib/TransisiContext.jsx'
import BarMusik from './BarMusik.jsx'
import KursorKustom from './KursorKustom.jsx'
import { useLenis } from '../hooks/useLenis.js'

export default function Layout({ children }) {
  useLenis()

  return (
    <MusicProvider>
      <TransisiProvider>
        <div className="min-h-dvh bg-bg text-ink">
          {children}
          {/* Gelombang + judul + kontrol musik jadi satu bar yang bisa
              disembunyikan, bukan tiga elemen mengambang terpisah. */}
          <BarMusik />
          {/* Di Layout, bukan di halaman: kalau ikut mount/unmount tiap ganti
              route, kursor asli berkedip muncul saat transisi. */}
          <KursorKustom />
        </div>
      </TransisiProvider>
    </MusicProvider>
  )
}
