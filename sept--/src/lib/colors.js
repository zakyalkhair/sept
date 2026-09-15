export const ACCENTS = ['coral', 'kuning', 'sage', 'langit', 'lilac']

const BG = {
  coral:  'bg-coral',
  kuning: 'bg-kuning',
  sage:   'bg-sage',
  langit: 'bg-langit',
  lilac:  'bg-lilac',
}

const ON = {
  coral:  'text-on-coral',
  kuning: 'text-on-kuning',
  sage:   'text-on-sage',
  langit: 'text-on-langit',
  lilac:  'text-on-lilac',
}

const HEX = {
  coral:  '#FF7A59',
  kuning: '#FFC94A',
  sage:   '#7FB99C',
  langit: '#6FA8DC',
  lilac:  '#B49BE0',
}

const ON_HEX = {
  coral:  '#5C1F0E',
  kuning: '#4D3702',
  sage:   '#123528',
  langit: '#0E2F4D',
  lilac:  '#2E1B4D',
}

export const bgClass = (w) => BG[w] ?? BG.coral
export const onClass = (w) => ON[w] ?? ON.coral

/* Hanya untuk nilai yang dianimasikan Motion/GSAP — di situ class tidak berlaku. */
export const bgHex = (w) => HEX[w] ?? HEX.coral
export const onHex = (w) => ON_HEX[w] ?? ON_HEX.coral
