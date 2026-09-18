import { motion } from 'motion/react'

/* Gerbang sebelum semuanya dimulai: layar kosong, satu kotak kado di
   tengah. Kliknya sekaligus jadi "sentuhan pertama" yang diwajibkan
   browser supaya lagu intro boleh berbunyi. */
export default function KotakKado({ onBuka }) {
  return (
    <motion.button
      type="button"
      onClick={onBuka}
      aria-label="Buka kado"
      data-kursor-teks="buka"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.25, transition: { duration: 0.5 } }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      className="absolute inset-0 z-40 m-auto flex h-fit w-fit cursor-pointer flex-col items-center gap-5 border-0 bg-transparent p-4"
    >
      <motion.svg
        viewBox="0 0 120 120"
        className="w-[min(9rem,38vw)] drop-shadow-[0_18px_24px_rgba(46,42,38,0.25)]"
        animate={{ rotate: [0, -4, 4, -3, 3, 0] }}
        transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 1.6, ease: 'easeInOut' }}
      >
        {/* badan */}
        <rect x="18" y="52" width="84" height="58" rx="6" fill="#e8756a" />
        {/* tutup */}
        <rect x="12" y="38" width="96" height="18" rx="5" fill="#f08a7e" />
        {/* pita */}
        <rect x="53" y="38" width="14" height="72" fill="#f6d28b" />
        {/* simpul */}
        <path d="M60 38 C44 20 30 26 36 36 C40 42 54 40 60 38 Z" fill="#f6d28b" />
        <path d="M60 38 C76 20 90 26 84 36 C80 42 66 40 60 38 Z" fill="#f6d28b" />
        <circle cx="60" cy="37" r="5" fill="#e9b85f" />
      </motion.svg>
    </motion.button>
  )
}
