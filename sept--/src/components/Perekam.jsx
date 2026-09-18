import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CLOUD, TAG_REKAM, UPLOAD_PRESET, setRekaman } from '../data/video.js'
import { useMusic } from '../lib/MusicContext.jsx'
import Tombol from './Tombol.jsx'

/* Perekam video untuk kartu Adlin.

   Alurnya: siap (preview kamera) → rekam → tinjau (putar ulang hasilnya)
   → rekam ulang ATAU kirim. Yang dikirim diunggah ke Cloudinary dan jadi
   video kartu ini; kiriman berikutnya menggantikannya (lihat video.js §1b).

   Dirender lewat portal ke <body>: panel Sorot bergerak dengan transform
   Motion, dan `position: fixed` di dalam elemen ber-transform ikut
   bergeser bersamanya. */
const MAKS_DETIK = 3 * 60

function pilihMime() {
  const calon = ['video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
  return calon.find((m) => window.MediaRecorder?.isTypeSupported?.(m)) || ''
}

function unggah(blob, onProgres) {
  return new Promise((resolve, reject) => {
    const data = new FormData()
    data.append('file', blob)
    data.append('upload_preset', UPLOAD_PRESET)
    data.append('public_id', `${TAG_REKAM}-${Date.now()}`)
    data.append('tags', TAG_REKAM)
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD}/video/upload`)
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgres(e.loaded / e.total)
    xhr.onload = () => {
      const j = JSON.parse(xhr.responseText || '{}')
      if (xhr.status < 300) resolve(j)
      else reject(new Error(j.error?.message || `HTTP ${xhr.status}`))
    }
    xhr.onerror = () => reject(new Error('koneksi terputus'))
    xhr.send(data)
  })
}

const jam = (d) => `${Math.floor(d / 60)}:${String(d % 60).padStart(2, '0')}`

export default function Perekam({ onTutup, onTerkirim }) {
  const [tahap, setTahap] = useState('siap') // siap | rekam | tinjau | kirim | gagal
  const [detik, setDetik] = useState(0)
  const [hasil, setHasil] = useState(null) // { blob, url }
  const [progres, setProgres] = useState(0)
  const [pesanGagal, setPesanGagal] = useState('')
  const streamRef = useRef(null)
  const recRef = useRef(null)
  const liveRef = useRef(null)
  const { duck } = useMusic()

  useEffect(() => {
    duck(true)
    return () => duck(false)
  }, [duck])

  /* Kamera dinyalakan sekali saat dibuka, dimatikan saat ditutup. */
  useEffect(() => {
    let batal = false
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true })
      .then((s) => {
        if (batal) return s.getTracks().forEach((t) => t.stop())
        streamRef.current = s
        if (liveRef.current) liveRef.current.srcObject = s
      })
      .catch(() => {
        setPesanGagal('Kamera tidak bisa dibuka. Izinkan akses kamera & mikrofon di browser, lalu coba lagi.')
        setTahap('gagal')
      })
    return () => {
      batal = true
      if (recRef.current?.state === 'recording') recRef.current.stop()
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  useEffect(() => () => hasil && URL.revokeObjectURL(hasil.url), [hasil])

  /* Preview langsung dipasang ulang tiap kembali ke tahap siap/rekam —
     elemen <video>-nya baru di-mount lagi setelah tahap tinjau. */
  useEffect(() => {
    if ((tahap === 'siap' || tahap === 'rekam') && liveRef.current && streamRef.current) {
      liveRef.current.srcObject = streamRef.current
    }
  }, [tahap])

  useEffect(() => {
    if (tahap !== 'rekam') return
    const t = setInterval(() => setDetik((d) => d + 1), 1000)
    /* Batas durasi: berkas terlalu panjang lambat diunggah dari HP. */
    const batas = setTimeout(() => recRef.current?.state === 'recording' && recRef.current.stop(), MAKS_DETIK * 1000)
    return () => {
      clearInterval(t)
      clearTimeout(batas)
    }
  }, [tahap])

  const mulai = () => {
    const s = streamRef.current
    if (!s) return
    const mime = pilihMime()
    const rec = new MediaRecorder(s, { ...(mime && { mimeType: mime }), videoBitsPerSecond: 2_500_000 })
    const bagian = []
    rec.ondataavailable = (e) => e.data.size && bagian.push(e.data)
    rec.onstop = () => {
      const blob = new Blob(bagian, { type: rec.mimeType })
      setHasil({ blob, url: URL.createObjectURL(blob) })
      setTahap('tinjau')
    }
    rec.start(1000)
    recRef.current = rec
    setDetik(0)
    setTahap('rekam')
  }

  const berhenti = () => {
    if (recRef.current?.state === 'recording') recRef.current.stop()
  }

  const rekamUlang = () => {
    setHasil(null)
    setTahap('siap')
  }

  const kirim = async () => {
    setTahap('kirim')
    setProgres(0)
    try {
      const j = await unggah(hasil.blob, setProgres)
      setRekaman(j.version, j.public_id)
      onTerkirim()
    } catch (err) {
      setPesanGagal(`Gagal mengirim: ${err.message}`)
      setTahap('gagal')
    }
  }

  const live = tahap === 'siap' || tahap === 'rekam'

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Rekam video"
      className="fixed inset-0 z-[65] flex flex-col items-center justify-center gap-4 overflow-y-auto bg-[rgba(20,16,12,0.92)] p-5 pb-[7rem] text-white landscape:gap-2 landscape:pb-[4.5rem]"
    >
      <h2 className="italic-accent text-[clamp(1.5rem,5vw,2.4rem)] leading-tight landscape:text-[clamp(1rem,3.2vh,1.5rem)]">
        {tahap === 'tinjau' ? 'sudah pas?' : 'rekam pesanmu'}
      </h2>

      <div className="relative w-full max-w-[min(40rem,92vw,calc((100dvh-18rem)*16/9))] landscape:max-w-[min(40rem,94vw,calc((100dvh-9rem)*16/9))]">
        {live ? (
          <video
            ref={liveRef}
            autoPlay
            muted
            playsInline
            className="aspect-video w-full rounded-xl bg-black object-cover [transform:scaleX(-1)]"
          />
        ) : hasil ? (
          <video src={hasil.url} controls playsInline className="aspect-video w-full rounded-xl bg-black" />
        ) : (
          <div className="aspect-video w-full rounded-xl bg-black/40" />
        )}

        {tahap === 'rekam' && (
          <span className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-sm tabular-nums">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" aria-hidden />
            {jam(detik)} / {jam(MAKS_DETIK)}
          </span>
        )}
      </div>

      {tahap === 'kirim' && (
        <div className="w-full max-w-xs">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
            <div className="h-full bg-white transition-[width]" style={{ width: `${progres * 100}%` }} />
          </div>
          <p className="mt-2 text-center text-sm opacity-75">mengirim… {Math.round(progres * 100)}%</p>
        </div>
      )}

      {tahap === 'gagal' && <p className="max-w-sm text-center text-sm opacity-85">{pesanGagal}</p>}

      <div className="flex flex-wrap items-center justify-center gap-4">
        {tahap === 'siap' && (
          <Tombol onClick={mulai} className="bg-red-500 px-5 font-medium text-white">
            ● mulai rekam
          </Tombol>
        )}
        {tahap === 'rekam' && (
          <Tombol onClick={berhenti} className="px-5 font-medium" style={{ background: 'var(--color-bg)', color: 'var(--color-ink)' }}>
            ■ selesai
          </Tombol>
        )}
        {tahap === 'tinjau' && (
          <>
            <Tombol onClick={kirim} className="px-5 font-medium" style={{ background: 'var(--color-bg)', color: 'var(--color-ink)' }}>
              kirim
            </Tombol>
            <button type="button" onClick={rekamUlang} className="tap link-garis text-sm">
              rekam ulang
            </button>
          </>
        )}
        {tahap === 'gagal' && hasil && (
          <Tombol onClick={kirim} className="px-5 font-medium" style={{ background: 'var(--color-bg)', color: 'var(--color-ink)' }}>
            coba kirim lagi
          </Tombol>
        )}
        {tahap !== 'kirim' && tahap !== 'rekam' && (
          <button type="button" onClick={onTutup} className="tap link-garis text-sm opacity-75">
            batal
          </button>
        )}
      </div>
    </div>,
    document.body
  )
}
