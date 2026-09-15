import { motion } from 'motion/react'
import { useMagnetic } from '../hooks/useMagnetic.js'
import { spring } from '../lib/motion.js'

export default function Tombol({
  children,
  onClick,
  className = '',
  kuat,
  radius,
  ...rest
}) {
  const { ref, x, y, aktif } = useMagnetic({ kuat, radius })
  const { style: styleLuar, ...sisanya } = rest

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      style={{ ...styleLuar, x, y }}
      whileHover={aktif ? { scale: 1.08 } : undefined}
      whileTap={{ scale: 0.94 }}
      transition={spring.snap}
      className={`tap grid place-items-center rounded-full ${className}`}
      {...sisanya}
    >
      {children}
    </motion.button>
  )
}
