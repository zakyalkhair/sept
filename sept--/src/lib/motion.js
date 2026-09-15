export const EASE = {
  in:        [0.16, 1, 0.3, 1],
  smooth:    [0.25, 1, 0.5, 1],
  overshoot: [0.34, 1.56, 0.64, 1],
  out:       [0.6, 0, 1, 1],
}

export const DUR = {
  micro: 0.2,
  enter: 0.6,
  exit:  0.45,
  page:  0.8,
}

/* Stagger mengecil. Untuk 21 elemen, linier terasa lamban;
   power2.in membuat ekornya rapat. */
export const stagger = (count, total = 0.9) => (i) =>
  total * Math.pow(i / Math.max(count - 1, 1), 2)

export const spring = {
  soft:  { type: 'spring', stiffness: 220, damping: 26, mass: 0.9 },
  snap:  { type: 'spring', stiffness: 420, damping: 30, mass: 0.7 },
  loose: { type: 'spring', stiffness: 120, damping: 18, mass: 1.1 },
}

/* Asimetri sebagai kebijakan: masuk pakai EASE.in, keluar pakai EASE.out. */
export const reveal = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: DUR.enter, ease: EASE.in } },
  exit:    { opacity: 0, y: -12, transition: { duration: DUR.exit, ease: EASE.out } },
}

/* Padanan sentuh wajib — dipasang di semua yang bisa ditekan. */
export const tapPress = {
  whileTap: { scale: 0.94 },
  transition: spring.snap,
}
