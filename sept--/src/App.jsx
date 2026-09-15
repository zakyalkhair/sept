import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import Layout from './components/Layout.jsx'
import Pembuka from './pages/Pembuka.jsx'
import Pesan from './pages/Pesan.jsx'
import Surat from './pages/Surat.jsx'
import Penutup from './pages/Penutup.jsx'
import { lenisRef } from './hooks/useLenis.js'

function ScrollToTop({ pathname }) {
  useEffect(() => {
    if (lenisRef.current) lenisRef.current.scrollTo(0, { immediate: true })
    else window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  const location = useLocation()

  return (
    <Layout>
      <ScrollToTop pathname={location.pathname} />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/"        element={<Pembuka />} />
          <Route path="/pesan"   element={<Pesan />} />
          <Route path="/surat"   element={<Surat />} />
          <Route path="/penutup" element={<Penutup />} />
          <Route path="*"        element={<Pembuka />} />
        </Routes>
      </AnimatePresence>
    </Layout>
  )
}
