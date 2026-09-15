import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { siapkanRekaman } from './data/video.js'
import './index.css'

/* Rekaman Adlin dicari dulu, BARU aplikasinya dimuat — `messages.js`
   menghitung URL video saat di-import, jadi harus sudah tahu jawabannya. */
await siapkanRekaman()
const { default: App } = await import('./App.jsx')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
