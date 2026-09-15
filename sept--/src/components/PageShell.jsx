import { motion } from 'motion/react'
import { DUR, EASE } from '../lib/motion.js'

/* tanpaGeser: transisi opacity saja, tanpa geser y. Dipakai halaman yang
   berisi elemen ber-layoutId (mis. kartu di /pesan) — transform y pada
   induk membuat pengukuran layout Motion meleset dan kartu "glitch" saat
   masuk. */
export default function PageShell({ children, className = '', tanpaGeser = false }) {
  const props = tanpaGeser
    ? {
        initial: false,
        animate: { opacity: 1 },
        exit: { opacity: 0, transition: { duration: DUR.page * 0.5, ease: EASE.out } },
      }
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0, transition: { duration: DUR.page, ease: EASE.in } },
        exit: { opacity: 0, y: -10, transition: { duration: DUR.page * 0.6, ease: EASE.out } },
      }

  return (
    <motion.main {...props} className={`min-h-dvh ${className}`}>
      {children}
    </motion.main>
  )
}
