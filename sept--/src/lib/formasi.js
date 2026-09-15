/* [kolom, baris] pada grid 8x7, 0-indeks. Urutan array = urutan kartu id 1..21. */
export const SEL = [
  [1, 0], [2, 0], [3, 0], [0, 1], [4, 1],
  [4, 2], [3, 3], [2, 4], [1, 5], [0, 6],
  [1, 6], [2, 6], [3, 6], [4, 6], [7, 0],
  [7, 1], [7, 2], [7, 3], [7, 4], [7, 5],
  [7, 6],
]

export const KOLOM = 8
export const BARIS = 7

/* Sel grid untuk kartu ke-i. CSS Grid 1-indeks. */
export function selOf(i) {
  const [cx, cy] = SEL[i] ?? [0, 0]
  return { col: cx + 1, row: cy + 1 }
}

/* Titik masuk: offset dari posisi akhir, dalam satuan viewport.
   Bergantian kiri-kanan, tinggi acak tapi deterministik. */
export function masukOf(i) {
  const dariKiri = i % 2 === 0
  const acak = ((i * 2654435761) >>> 0) / 4294967296
  return {
    x: dariKiri ? '-120vw' : '120vw',
    y: `${-30 + acak * 60}vh`,
    rot: (dariKiri ? -1 : 1) * (18 + acak * 22),
  }
}
